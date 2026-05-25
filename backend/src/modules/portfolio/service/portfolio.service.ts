import { PortfolioRepository } from "../../core/PortfolioRepository";
import { Portfolio } from "../../shared/entities";
import { PortfolioSection } from "../../shared/entities/PortfolioSection";
import { AppDataSource } from "../../core";
import { StudentAssessmentScore } from "../../shared/entities/StudentAssessmentScore";
import { Student } from "../../shared/entities/StudentEntity";
import { Repository } from "typeorm";
import { PortfolioStatus } from "../../shared/entities/EntityEnums";

export interface CreatePortfolio {
    studentId: number;
    classroomId: number;
    schoolId: number;
    startDate: Date;
    endDate: Date;
}

export interface AddPortfolioSection {
    portfolioId: number;
    content: string;
    mediaUrls?: string[];
    contentEntryDate?: Date;
    contentEntryTime?: string;
    mediaEntryDate?: Date;
    mediaEntryTime?: string;
}

export interface UpdatePortfolioSection {
    content?: string;
    mediaUrls?: string[];
    contentEntryDate?: Date;
    contentEntryTime?: string;
    mediaEntryDate?: Date;
    mediaEntryTime?: string;
}

export interface UpdatePortfolioEntry {
    startDate: Date;
    endDate: Date;
}

export interface PatchPortfolioStatus {
    status: PortfolioStatus;
}

export class PortfolioService {
    private portfolioRepository: PortfolioRepository;

    private get studentRepo(): Repository<Student> {
        return AppDataSource.getRepository(Student);
    }

    private get portfolioSectionRepo(): Repository<PortfolioSection> {
        return AppDataSource.getRepository(PortfolioSection);
    }

    private get studentAssessmentScoreRepo(): Repository<StudentAssessmentScore> {
        return AppDataSource.getRepository(StudentAssessmentScore);
    }

    constructor() {
        this.portfolioRepository = new PortfolioRepository();
    }

    async createPortfolioEntry(data: CreatePortfolio): Promise<{ success: boolean, message: string, data?: Portfolio }> {

        const student = await this.studentRepo.findOne({
            where: {
                id: data.studentId,
            },
            relations: [
                'currentClassroom',
                'currentClassroom.school'
            ]
        });
        if (!student) {
            return {
                success: false,
                message: "Student not found"
            };
        }
        if (student.currentClassroom?.school?.id !== data.schoolId) {
            return {
                success: false,
                message: "Student does not belong to the chosen school"
            };
        }

        if (student.currentClassroom?.id !== data.classroomId) {
            return {
                success: false,
                message: "Student does not belong to the chosen classroom"
            };
        }

        const savedEntry = await this.portfolioRepository.create({
            studentId: data.studentId,
            classroomId: data.classroomId,
            schoolId: data.schoolId,
            startDate: data.startDate,
            endDate: data.endDate
        });

        return {
            success: true,
            message: "Portfolio created successfully",
            data: savedEntry
        };
    }

    async addPortfolioSection(data: AddPortfolioSection): Promise<{ success: boolean, message: string, data?: PortfolioSection }> {
        const portfolio = await this.portfolioRepository.findById(data.portfolioId);
        if (!portfolio) {
            return {
                success: false,
                message: "Portfolio not found"
            };
        }

        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const savedSection = await this.portfolioSectionRepo.save({
            portfolioId: data.portfolioId,
            content: data.content,
            mediaUrls: data.mediaUrls,
            contentEntryDate: data.contentEntryDate || now,
            contentEntryTime: data.contentEntryTime || currentTime,
            mediaEntryDate: data.mediaUrls && data.mediaUrls.length > 0 ? (data.mediaEntryDate || now) : data.mediaEntryDate,
            mediaEntryTime: data.mediaUrls && data.mediaUrls.length > 0 ? (data.mediaEntryTime || currentTime) : data.mediaEntryTime,
        });

        return {
            success: true,
            message: "Portfolio section added successfully",
            data: savedSection
        };
    }

    async updatePortfolioSection(sectionId: number, data: UpdatePortfolioSection): Promise<{ success: boolean, message: string, data?: PortfolioSection }> {
        const section = await this.portfolioSectionRepo.findOne({
            where: { id: sectionId }
        });

        if (!section) {
            return {
                success: false,
                message: "Portfolio section not found"
            };
        }

        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });

        if (data.content !== undefined) {
            section.content = data.content;
            section.contentEntryDate = data.contentEntryDate || section.contentEntryDate || now;
            section.contentEntryTime = data.contentEntryTime || section.contentEntryTime || currentTime;
        }

        if (data.mediaUrls !== undefined) {
            section.mediaUrls = data.mediaUrls;
            if (data.mediaUrls.length > 0) {
                section.mediaEntryDate = data.mediaEntryDate || section.mediaEntryDate || now;
                section.mediaEntryTime = data.mediaEntryTime || section.mediaEntryTime || currentTime;
            }
        }

        // Allow explicit overrides if provided even without content/media change
        if (data.contentEntryDate) section.contentEntryDate = data.contentEntryDate;
        if (data.contentEntryTime) section.contentEntryTime = data.contentEntryTime;
        if (data.mediaEntryDate) section.mediaEntryDate = data.mediaEntryDate;
        if (data.mediaEntryTime) section.mediaEntryTime = data.mediaEntryTime;

        const updatedSection = await this.portfolioSectionRepo.save(section);

        return {
            success: true,
            message: "Portfolio section updated successfully",
            data: updatedSection
        };
    }

    async getPortfolios(params: {
        schoolId: number,
        studentId?: number,
        classroomId?: number,
        startDate?: Date,
        endDate?: Date,
        pos?: number,
        delta?: number
    }) {
        let { schoolId, studentId, classroomId, startDate, endDate, pos = 1, delta = 10 } = params;

        pos = Math.max(1, pos);
        delta = Math.max(1, Math.min(delta, 100));

        const portfolioQuery = this.portfolioRepository.createQueryBuilder("portfolio")
            .leftJoinAndSelect("portfolio.sections", "sections")
            .leftJoinAndSelect("portfolio.student", "student")
            .leftJoinAndSelect("student.user", "user")
            .leftJoinAndSelect("student.currentClassroom", "currentClassroom")
            .where("portfolio.schoolId = :schoolId", { schoolId });

        if (studentId) {
            portfolioQuery.andWhere("portfolio.studentId = :studentId", { studentId });
        } else if (classroomId) {
            portfolioQuery.andWhere("student.classroomId = :classroomId", { classroomId });
        }

        if (startDate && endDate) {
            portfolioQuery.andWhere("portfolio.startDate <= :endDate AND portfolio.endDate >= :startDate", { startDate, endDate });
        }

        const totalCount = await portfolioQuery.getCount();
        const skip = (pos - 1) * delta;

        const portfolios = await portfolioQuery
            .orderBy("portfolio.startDate", "DESC")
            .skip(skip)
            .take(delta)
            .getMany();

        if (portfolios.length === 0) {
            return {
                data: [],
                pagination: { total: 0, pos, delta, totalPages: 0 }
            };
        }

        const data = await this.mapPortfoliosWithGrades(portfolios, startDate, endDate);

        return {
            data,
            pagination: {
                total: totalCount,
                pos,
                delta,
                totalPages: Math.ceil(totalCount / delta)
            }
        };
    }

    async getPortfolioById(id: number, schoolId: number, startDate?: Date, endDate?: Date) {
        const portfolio = await this.portfolioRepository.createQueryBuilder("portfolio")
            .leftJoinAndSelect("portfolio.sections", "sections")
            .leftJoinAndSelect("portfolio.student", "student")
            .leftJoinAndSelect("student.user", "user")
            .leftJoinAndSelect("student.currentClassroom", "currentClassroom")
            .where("portfolio.id = :id AND portfolio.schoolId = :schoolId", { id, schoolId })
            .getOne();

        if (!portfolio) return null;

        const mapped = await this.mapPortfoliosWithGrades([portfolio], startDate, endDate);
        return mapped[0];
    }

    private async mapPortfoliosWithGrades(portfolios: Portfolio[], startDate?: Date, endDate?: Date) {
        if (portfolios.length === 0) return [];

        const studentIds = [...new Set(portfolios.map(p => p.studentId))];

        // Fetch scored milestone grades for these students
        const milestoneQuery = this.studentAssessmentScoreRepo
            .createQueryBuilder("score")
            .leftJoinAndSelect("score.milestone", "milestone")
            .leftJoinAndSelect("milestone.subject", "subject")
            .where("score.studentId IN (:...studentIds)", { studentIds })
            .andWhere("score.milestoneId IS NOT NULL");

        if (startDate && endDate) {
            milestoneQuery.andWhere("score.createdAt >= :startDate", { startDate })
                .andWhere("score.createdAt <= :endDate", { endDate });
        }

        const allMilestoneGrades = await milestoneQuery.getMany();

        return portfolios.map(portfolio => {
            const student = portfolio.student;
            const pStart = startDate || portfolio.startDate;
            const pEnd = endDate || portfolio.endDate;

            // Scored milestone grades within the date window
            const completedGrades = allMilestoneGrades.filter(mg =>
                mg.studentId === (student?.id ?? portfolio.studentId) &&
                new Date(mg.createdAt) >= new Date(pStart) &&
                new Date(mg.createdAt) <= new Date(pEnd)
            );

            // Sort milestone grades by latest first for consistent API ordering
            completedGrades.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            const milestones = completedGrades.map((grade) => ({
                milestoneId: grade.milestoneId,
                milestoneName: grade.milestone?.title ?? null,
                subjectName: grade.milestone?.subject?.name ?? null,
                score: grade.score ?? grade.gradeValue ?? null,
                createdAt: grade.createdAt
            }));

            return {
                id: portfolio.id,
                status: portfolio.status,
                startDate: portfolio.startDate,
                endDate: portfolio.endDate,
                createdAt: portfolio.createdAt,
                updatedAt: portfolio.updatedAt,
                sectionCount: portfolio.sections?.length || 0,
                sections: portfolio.sections || [],
                student: student ? {
                    id: student.id,
                    firstName: student.user?.firstName,
                    lastName: student.user?.lastName,
                    admissionNumber: student.admissionNumber,
                    profileUrl: student.photoUrl ?? null,
                    classroom: student.currentClassroom ? {
                        id: student.currentClassroom.id,
                        name: student.currentClassroom.classroomName
                    } : null
                } : null,
                milestones
            };
        });
    }

    async getStudentGrades(schoolId: number, studentId?: number): Promise<{
        subjectName: string | null;
        milestoneName: string | null;
        date: Date;
        score: number | null;
        gradeValue: string | null;
        studentId: number;
        studentName: string | null;
    }[]> {
        const query = this.studentAssessmentScoreRepo
            .createQueryBuilder("score")
            .leftJoinAndSelect("score.milestone", "milestone")
            .leftJoinAndSelect("milestone.subject", "subject")
            .leftJoinAndSelect("score.student", "student")
            .leftJoinAndSelect("student.user", "user")
            .where("student.schoolId = :schoolId", { schoolId })
            .andWhere("score.milestoneId IS NOT NULL");

        if (studentId) {
            query.andWhere("score.studentId = :studentId", { studentId });
        }

        query.orderBy("score.createdAt", "DESC");

        const scores = await query.getMany();

        return scores.map(s => ({
            studentId: s.studentId,
            studentName: s.student?.user
                ? `${s.student.user.firstName} ${s.student.user.lastName}`
                : null,
            subjectName: s.milestone?.subject?.name ?? null,
            milestoneName: s.milestone?.title ?? null,
            date: s.createdAt,
            score: s.score ?? null,
            gradeValue: s.gradeValue ?? null
        }));
    }

    async updatePortfolioEntry(id: number, schoolId: number, data: UpdatePortfolioEntry): Promise<{ success: boolean, message: string, data?: Portfolio }> {
        const portfolio = await this.portfolioRepository
            .createQueryBuilder("portfolio")
            .where("portfolio.id = :id AND portfolio.schoolId = :schoolId", { id, schoolId })
            .getOne();

        if (!portfolio) {
            return {
                success: false,
                message: "Portfolio not found"
            };
        }

        portfolio.startDate = data.startDate;
        portfolio.endDate = data.endDate;

        const updatedPortfolio = await AppDataSource.getRepository(Portfolio).save(portfolio);

        return {
            success: true,
            message: "Portfolio updated successfully",
            data: updatedPortfolio
        };
    }

    async patchPortfolioStatus(id: number, schoolId: number, data: PatchPortfolioStatus): Promise<{ success: boolean, message: string, data?: Portfolio }> {
        const portfolio = await this.portfolioRepository
            .createQueryBuilder("portfolio")
            .where("portfolio.id = :id AND portfolio.schoolId = :schoolId", { id, schoolId })
            .getOne();

        if (!portfolio) {
            return {
                success: false,
                message: "Portfolio not found"
            };
        }

        portfolio.status = data.status;

        const updatedPortfolio = await AppDataSource.getRepository(Portfolio).save(portfolio);

        return {
            success: true,
            message: "Portfolio status updated successfully",
            data: updatedPortfolio
        };
    }

    async deletePortfolioEntry(id: number): Promise<boolean> {
        return this.portfolioRepository.deleteById(id);
    }

    async deletePortfolioSection(sectionId: number): Promise<{ success: boolean; message: string }> {
        const section = await this.portfolioSectionRepo.findOne({
            where: { id: sectionId }
        });

        if (!section) {
            return {
                success: false,
                message: "Portfolio section not found"
            };
        }

        await this.portfolioSectionRepo.remove(section);

        return {
            success: true,
            message: "Portfolio section deleted successfully"
        };
    }
}

export const portfolioService = new PortfolioService();
