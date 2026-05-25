import { AppDataSource } from "../../core/config/database";
import { User } from "../../shared/entities/User";
import { UserRole } from "../../shared/entities/EntityEnums";

export class UserStatsService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Get user statistics with optional filters and date range comparison
   */
  async getUserStats(filters?: {
    city?: string;
    state?: string;
    countryCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const stats = await this.calculateStats(filters);

      // Calculate previous period stats and growth if date range is provided
      let prevStats: any | undefined;
      let growth: any;

      if (filters?.startDate && filters?.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        const periodDuration = end.getTime() - start.getTime();

        // Calculate previous period dates
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - periodDuration);

        const prevFilters = {
          ...filters,
          startDate: prevStart.toISOString(),
          endDate: prevEnd.toISOString(),
        };

        prevStats = await this.calculateStats(prevFilters);

        // Calculate growth
        growth = {
          totalUsers: this.calculateGrowth(prevStats.totalUsers, stats.totalUsers),
          recent: {
            last7Days: this.calculateGrowth(prevStats.recent.last7Days, stats.recent.last7Days),
            last30Days: this.calculateGrowth(prevStats.recent.last30Days, stats.recent.last30Days),
          },
        };
      }

      return {
        success: true,
        message: "User statistics retrieved successfully",
        data: {
          stats,
          prevStats,
          growth,
        },
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to retrieve user statistics",
      };
    }
  }

  /**
   * Calculate user statistics for a given period
   */
  private async calculateStats(filters?: {
    city?: string;
    state?: string;
    countryCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    // Build base query for users (only customers, owners, agents)
    const userQueryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .where("user.role IN (:...roles)", { roles: [UserRole.PARENT, UserRole.STAFF] });

    // Apply location filters to profile
    if (filters?.city) {
      userQueryBuilder.andWhere("profile.city = :city", { city: filters.city });
    }
    if (filters?.state) {
      userQueryBuilder.andWhere("profile.state = :state", { state: filters.state });
    }
    if (filters?.countryCode) {
      userQueryBuilder.andWhere("profile.countryCode = :countryCode", { countryCode: filters.countryCode });
    }

    // Apply date filters
    if (filters?.startDate) {
      userQueryBuilder.andWhere("user.createdAt >= :startDate", { startDate: new Date(filters.startDate) });
    }
    if (filters?.endDate) {
      userQueryBuilder.andWhere("user.createdAt <= :endDate", { endDate: new Date(filters.endDate) });
    }

    // Get total count
    const totalUsers = await userQueryBuilder.getCount();

    // Get distribution by country
    const byCountryQuery = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .select("profile.countryCode", "countryCode")
      .addSelect("COUNT(*)", "count")
      .where("user.role IN (:...roles)", { roles: [UserRole.STAFF] })
      .andWhere("profile.countryCode IS NOT NULL")
      .groupBy("profile.countryCode")
      .orderBy("count", "DESC")
      .limit(10);

    if (filters?.startDate) {
      byCountryQuery.andWhere("user.createdAt >= :startDate", { startDate: new Date(filters.startDate) });
    }
    if (filters?.endDate) {
      byCountryQuery.andWhere("user.createdAt <= :endDate", { endDate: new Date(filters.endDate) });
    }

    const byCountry = await byCountryQuery.getRawMany();

    // Get distribution by state
    const byStateQuery = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .select("profile.state", "state")
      .addSelect("COUNT(*)", "count")
      .where("user.role IN (:...roles)", { roles: [UserRole.STAFF] })
      .andWhere("profile.state IS NOT NULL")
      .groupBy("profile.state")
      .orderBy("count", "DESC")
      .limit(10);

    if (filters?.city) {
      byStateQuery.andWhere("profile.city = :city", { city: filters.city });
    }
    if (filters?.countryCode) {
      byStateQuery.andWhere("profile.countryCode = :countryCode", { countryCode: filters.countryCode });
    }
    if (filters?.startDate) {
      byStateQuery.andWhere("user.createdAt >= :startDate", { startDate: new Date(filters.startDate) });
    }
    if (filters?.endDate) {
      byStateQuery.andWhere("user.createdAt <= :endDate", { endDate: new Date(filters.endDate) });
    }

    const byState = await byStateQuery.getRawMany();

    // Get distribution by city
    const byCityQuery = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .select("profile.city", "city")
      .addSelect("COUNT(*)", "count")
      .where("user.role IN (:...roles)", { roles: [UserRole.STAFF] })
      .andWhere("profile.city IS NOT NULL")
      .groupBy("profile.city")
      .orderBy("count", "DESC")
      .limit(10);

    if (filters?.state) {
      byCityQuery.andWhere("profile.state = :state", { state: filters.state });
    }
    if (filters?.countryCode) {
      byCityQuery.andWhere("profile.countryCode = :countryCode", { countryCode: filters.countryCode });
    }
    if (filters?.startDate) {
      byCityQuery.andWhere("user.createdAt >= :startDate", { startDate: new Date(filters.startDate) });
    }
    if (filters?.endDate) {
      byCityQuery.andWhere("user.createdAt <= :endDate", { endDate: new Date(filters.endDate) });
    }

    const byCity = await byCityQuery.getRawMany();

    // Get recent registrations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last7DaysQuery = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .where("user.role IN (:...roles)", { roles: [UserRole.STAFF] })
      .andWhere("user.createdAt >= :sevenDaysAgo", { sevenDaysAgo });

    if (filters?.city) {
      last7DaysQuery.andWhere("profile.city = :city", { city: filters.city });
    }
    if (filters?.state) {
      last7DaysQuery.andWhere("profile.state = :state", { state: filters.state });
    }
    if (filters?.countryCode) {
      last7DaysQuery.andWhere("profile.countryCode = :countryCode", { countryCode: filters.countryCode });
    }

    const last7Days = await last7DaysQuery.getCount();

    const last30DaysQuery = this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .where("user.role IN (:...roles)", { roles: [UserRole.STAFF] })
      .andWhere("user.createdAt >= :thirtyDaysAgo", { thirtyDaysAgo });

    if (filters?.city) {
      last30DaysQuery.andWhere("profile.city = :city", { city: filters.city });
    }
    if (filters?.state) {
      last30DaysQuery.andWhere("profile.state = :state", { state: filters.state });
    }
    if (filters?.countryCode) {
      last30DaysQuery.andWhere("profile.countryCode = :countryCode", { countryCode: filters.countryCode });
    }

    const last30Days = await last30DaysQuery.getCount();

    return {
      totalUsers,
      byCountry: byCountry.map((item) => ({
        countryCode: item.countryCode,
        count: parseInt(item.count),
      })),
      byState: byState.map((item) => ({
        state: item.state,
        count: parseInt(item.count),
      })),
      byCity: byCity.map((item) => ({
        city: item.city,
        count: parseInt(item.count),
      })),
      recent: {
        last7Days,
        last30Days,
      },
    };
  }

  /**
   * Calculate growth percentage
   */
  private calculateGrowth(oldValue: number, newValue: number): number {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    const growth = ((newValue - oldValue) / oldValue) * 100;
    return Math.round(growth * 100) / 100;
  }
}

export const userStatsService = new UserStatsService();
