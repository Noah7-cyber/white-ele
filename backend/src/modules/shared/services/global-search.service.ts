import {
  GlobalSearchOptions,
  GlobalSearchResponse,
  SearchGroupedItem,
  SearchProviderId,
  SearchUserContext,
} from "../types/global-search.types";
import { searchProviders } from "../providers";


export const normalizeSearch = (value: string) => value.trim().toLowerCase();

export const applySearchFilter = (q: string) => `%${q}%`;



const defaultLimits: Record<SearchProviderId, number> = {
  student: 5,
  classroom: 3,
  staff: 5,
  admin: 3,
  parent: 5,
  announcement: 5,
  curriculum: 3,
  subject: 5,
  milestone: 3,
  assessment: 5,
};

const roleProviderMap: Record<string, SearchProviderId[]> = {
  admin: [
    "student",
    "classroom",
    "staff",
    "admin",
    "parent",
    "announcement",
    "curriculum",
    "subject",
    "milestone",
    "assessment",
  ],
  super_admin: [
    "student",
    "classroom",
    "staff",
    "admin",
    "parent",
    "announcement",
    "curriculum",
    "subject",
    "milestone",
    "assessment",
  ],
  staff: [
    "student",
    "classroom",
    "staff",
    "parent",
    "announcement",
    "curriculum",
    "subject",
    "milestone",
    "assessment",
  ],
  parent: [
    "student",
    "classroom",
    "announcement",
    "curriculum",
    "subject",
    "milestone",
    "assessment",
  ],
  student: [
    "student",
    "classroom",
    "announcement",
    "curriculum",
    "subject",
    "milestone",
    "assessment",
  ],
};

const normalizeQuery = (value: string) => value.trim().toLowerCase();

export class GlobalSearchService {
  async search(q: string, user: SearchUserContext, options: GlobalSearchOptions = {}): Promise<GlobalSearchResponse> {
    const query = normalizeQuery(q);
    if (!query) {
      return {
        results: {
          student: [],
          classroom: [],
          staff: [],
          admin: [],
          parent: [],
          announcement: [],
          curriculum: [],
          subject: [],
          milestone: [],
          assessment: [],
        },
        pagination: {
          perProvider: {
            student: 0,
            classroom: 0,
            staff: 0,
            admin: 0,
            parent: 0,
            announcement: 0,
            curriculum: 0,
            subject: 0,
            milestone: 0,
            assessment: 0,
          },
          limits: defaultLimits,
          page: 1,
        },
      };
    }

    if (!user.schoolId) {
      throw new Error("schoolId is required for search");
    }

    const providerIds = roleProviderMap[user.role] || [];
    const providers = searchProviders.filter((provider) => providerIds.includes(provider.id));
    const limits = { ...defaultLimits };
    const page = Math.max(1, Math.floor(options.page || 1));

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const limit = limits[provider.id] ?? 5;
          const offset = (page - 1) * limit;
          const res = await provider.search({
            q: query,
            user,
            schoolId: user.schoolId!,
            limit,
            offset,
          });
          return {
            providerId: res.providerId,
            items: (res.items || []).slice(0, limit),
            total: res.total || 0,
          };
        } catch {
          return { providerId: provider.id, items: [] };
        }
      })
    );

    const perProvider = {
      student: 0,
      classroom: 0,
      staff: 0,
      admin: 0,
      parent: 0,
      announcement: 0,
      curriculum: 0,
      subject: 0,
      milestone: 0,
      assessment: 0,
    } as Record<SearchProviderId, number>;

    const groupedResults: Record<SearchProviderId, SearchGroupedItem[]> = {
      student: [],
      classroom: [],
      staff: [],
      admin: [],
      parent: [],
      announcement: [],
      curriculum: [],
      subject: [],
      milestone: [],
      assessment: [],
    };

    const userTypes = new Set<SearchProviderId>(["student", "staff", "parent", "admin"]);

    results.forEach((result) => {
      perProvider[result.providerId] = (result as any).total || 0;
      groupedResults[result.providerId] = result.items.map((item) => {
        const display = item.display || {};

        if (userTypes.has(item.type)) {
          return {
            id: item.id,
            firstName: display["firstName"] || "",
            lastName: display["lastName"] || "",
            email: display["email"] || "",
            profileUrl: display["profileUrl"] || display["photo"] || null,
          };
        }

        return {
          id: item.id,
          name: display["name"] || "Untitled",
        };
      });
    });

    const response: GlobalSearchResponse = {
      results: groupedResults,
      pagination: {
        perProvider,
        limits,
        page,
      },
    };

    return response;
  }
}

export const globalSearchService = new GlobalSearchService();
