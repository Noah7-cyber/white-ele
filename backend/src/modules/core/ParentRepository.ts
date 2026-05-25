import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Parent } from "../shared/entities/Parent"; 
import { User } from "../shared/entities/User";
import { Student } from "../shared/entities/StudentEntity";

export class ParentRepository {
    private repository: Repository<Parent>;
    private userRepository: Repository<User>;
    private studentRepository: Repository<Student>;

    constructor() {
        this.repository = AppDataSource.getRepository(Parent);
        this.userRepository = AppDataSource.getRepository(User);
        this.studentRepository = AppDataSource.getRepository(Student);
    }

    createQueryBuilder(alias = "parent") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<Parent>): Promise<Parent> {
        const parent = this.repository.create(data);
        return this.repository.save(parent);
    }

    // Improved: load parent.user + children
    async findById(id: number): Promise<Parent | null> {
        return this.repository.findOne({
            where: { id },
            relations: ["user", "children", "children.user"],
        });
    }

    async findUserById(userId: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async findByUserId(userId: number): Promise<Parent | null> {
        return this.repository.findOne({ where: { user: { id: userId } }, relations: ["user"] });
    }

    // Attach parent to student (Many-to-Many)
    async attachParentToStudent(studentId: number, parentId: number) {
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
            relations: ["parents"],
        });

        const parent = await this.repository.findOne({
            where: { id: parentId },
            relations: ["user"],
        });

        if (!student) {
            throw new Error("Student not found");
        }

        if (!parent) {
            throw new Error("Parent not found");
        }

        // Prevent duplicates
        if (student.parents.some(p => p.id === parent.id)) {
            return student;
        }

        student.parents = [...student.parents, parent];

        return this.studentRepository.save(student);
    }

    async findStudentParentLink(studentId: number, parentId: number) {
        return await AppDataSource.query(
            `SELECT * FROM parent_student WHERE studentId = ? AND parentId = ?`,
            [studentId, parentId]
        );

    
    }

    async findAll(): Promise<Parent[]> {
        return this.repository.find({ relations: ["user"] }); // default: just user
    }

    async softDelete(id: number): Promise<void> {
        await this.repository.softDelete(id);
    }

    getUserRepository(): Repository<User> {
        return this.userRepository;
    }

    async softDeleteUser(userId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user && user.email && !user.email.includes('[deleted]')) {
            const parts = user.email.split('@');
            if (parts.length === 2) {
                user.email = `${parts[0]}[deleted]@${parts[1]}`;
            } else {
                user.email = `${user.email}[deleted]`;
            }
            await this.userRepository.save(user);
        }
        await this.userRepository.softDelete(userId);
    }
}
