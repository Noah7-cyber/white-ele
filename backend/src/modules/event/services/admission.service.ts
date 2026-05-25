import { AppDataSource } from "../../core/config/database";

export interface AdmissionFilters {
    search?: string;
    startDate?: string;
    endDate?: string;
    pos?: number;
    delta?: number;
}

export interface AdmissionRecord {
    id: number;
    name: string;
    type: "form" | "tour";
    createdAt: Date;
    status: string;
    url?: string | null;
    slug?: string | null;
}

class AdmissionService {
    async listAdmissions(
        schoolId: number,
        filters: AdmissionFilters
    ): Promise<{ data: AdmissionRecord[]; pagination: { pos: number; delta: number; count: number } }> {
        const { search, startDate, endDate, pos: posFilter, delta: deltaFilter } = filters;
        const usePagination = posFilter !== undefined || deltaFilter !== undefined;
        const pos = usePagination ? (posFilter ?? 0) : 0;
        const delta = usePagination ? (deltaFilter ?? 20) : Number.MAX_SAFE_INTEGER;

        const values: Array<string | number | Date> = [];
        const addValue = (value: string | number | Date): string => {
            values.push(value);
            return `$${values.length}`;
        };

        const searchPattern = search ? `%${search}%` : undefined;
        const hasDateFilter = Boolean(startDate && endDate);
        const start = hasDateFilter ? new Date(startDate as string) : undefined;
        const end = hasDateFilter ? new Date(endDate as string) : undefined;

        const tourWhere = [`te."schoolId" = ${addValue(schoolId)}`, `te."deletedAt" IS NULL`];
        if (hasDateFilter && start && end) {
            tourWhere.push(`te."createdAt" BETWEEN ${addValue(start)} AND ${addValue(end)}`);
        }
        if (searchPattern) {
            const placeholder = addValue(searchPattern);
            tourWhere.push(`(te."title" ILIKE ${placeholder} OR te."url" ILIKE ${placeholder} OR CAST(te."status" AS text) ILIKE ${placeholder})`);
        }

        const formWhere = [`f."schoolId" = ${addValue(schoolId)}`];
        if (hasDateFilter && start && end) {
            formWhere.push(`f."createdAt" BETWEEN ${addValue(start)} AND ${addValue(end)}`);
        }
        if (searchPattern) {
            const placeholder = addValue(searchPattern);
            formWhere.push(`(f."title" ILIKE ${placeholder} OR f."slug" ILIKE ${placeholder} OR CAST(f."status" AS text) ILIKE ${placeholder})`);
        }

        const unionQuery = `
            SELECT
                te."id"::int AS "id",
                COALESCE(te."title", 'Unknown Tour') AS "name",
                'tour' AS "type",
                te."createdAt" AS "createdAt",
                COALESCE(te."status"::text, '') AS "status",
                te."url" AS "url",
                NULL::text AS "slug"
            FROM "tour_events" te
            WHERE ${tourWhere.join(" AND ")}

            UNION ALL

            SELECT
                f."id"::int AS "id",
                COALESCE(f."title", 'Unknown Form') AS "name",
                'form' AS "type",
                f."createdAt" AS "createdAt",
                COALESCE(f."status"::text, '') AS "status",
                NULL::text AS "url",
                f."slug" AS "slug"
            FROM "forms" f
            WHERE ${formWhere.join(" AND ")}
        `;

        const countQuery = `SELECT COUNT(*)::int AS "count" FROM (${unionQuery}) AS admissions_union`;
        const countResult = await AppDataSource.query(countQuery, values);
        const count = Number(countResult?.[0]?.count ?? 0);

        const dataQuery = `
            SELECT * FROM (${unionQuery}) AS admissions_union
            ORDER BY "createdAt" DESC
            ${usePagination ? `LIMIT ${addValue(delta)} OFFSET ${addValue(pos)}` : ""}
        `;
        const rawRows = await AppDataSource.query(dataQuery, values);
        const data: AdmissionRecord[] = rawRows.map((row: any) => ({
            ...row,
            createdAt: new Date(row.createdAt),
        }));

        const normalizedDelta = usePagination ? delta : count;

        return {
            data,
            pagination: { pos, delta: normalizedDelta, count }
        };
    }
}

export const admissionService = new AdmissionService();
