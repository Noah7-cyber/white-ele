import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Portfolio } from "../shared/entities/Portfolio";

export class PortfolioRepository {
    private repository: Repository<Portfolio>;

    constructor() {
        this.repository = AppDataSource.getRepository(Portfolio);
    }

    createQueryBuilder(alias = "portfolio") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<Portfolio>): Promise<Portfolio> {
        const portfolio = this.repository.create(data);
        return this.repository.save(portfolio);
    }

    async findById(id: number): Promise<Portfolio | null> {
        return this.repository.findOne({ where: { id }, relations: ["student", "classroom", "sections"] });
    }

    async findAllByStudentId(studentId: number): Promise<Portfolio[]> {
        return this.repository.find({
            where: { studentId },
            order: { createdAt: 'DESC' }
        });
    }

    async deleteById(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected === 1;
    }
}
