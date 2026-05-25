import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Student } from "../shared/entities/StudentEntity";
import { User } from "../shared/entities/User";

export class StudentRepository {
    private repository: Repository<Student>;
    private userRepository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(Student);
        this.userRepository = AppDataSource.getRepository(User);
    }

    createQueryBuilder(alias = "student") {
        return this.repository.createQueryBuilder(alias);
    }

    async create(data: Partial<Student>): Promise<Student> {
        const student = this.repository.create(data);
        return this.repository.save(student);
    }

    // Find a student by ID
    async findById(id: number): Promise<Student | null> {
        return this.repository.findOne({ where: { id }, relations: ["user"] });
    }

    // Find all students with optional relations
    async findAll(): Promise<Student[]> {
        return this.repository.find({ relations: ["user", "school", "classroom", "parents"] });
    }

    // Fetch a User by ID
    async findUserById(userId: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async findAllBySchoolId(schoolId: number): Promise<Student[]> {
        return this.repository.find({ where: { schoolId } });
    }

    async findAllByAdmissionNumber(admissionNumber: string): Promise<Student[]> {
        return this.repository.find({ where: { admissionNumber } });
    }

 async softDeleteById(studentId: number): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id: studentId })
      .andWhere('deletedAt IS NULL')
      .execute();

    return result.affected === 1;
  }

    async findAllByClassroomId(classroomId: number): Promise<Student[]> {
        return this.repository.find({ where: { classroomId } });
    }

    async findAllByStudentName(search: string): Promise<Student[]> {
    const formattedSearch = `${search.toLowerCase()}%`;

    return this.repository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.user", "user")
        .where("LOWER(user.firstName) LIKE :search", { search: formattedSearch })
        .orWhere("LOWER(user.lastName) LIKE :search", { search: formattedSearch })
        .orWhere("LOWER(user.middleName) LIKE :search", { search: formattedSearch })
        .getMany();
    }

    async updateById(id: number, data: Partial<Student>): Promise<Student | null> {
    // preload merges data into an existing entity safely
    const student = await this.repository.preload({
        id,
        ...data
    });

    if (!student) return null;

    return this.repository.save(student); // updatedAt auto-updates if using @UpdateDateColumn
}

}