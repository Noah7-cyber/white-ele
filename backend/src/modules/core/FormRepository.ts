import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { Form } from "../shared/entities/Form";
import { FormItem } from "../shared/entities/FormItem";
import { FormItemOption } from "../shared/entities/FormItemOption";
import { FormResponse } from "../shared/entities/FormResponse";

export class FormRepository {
    private formRepo: Repository<Form>;
    private formItemRepo: Repository<FormItem>;
    private formItemOptionRepo: Repository<FormItemOption>;
    private formResponseRepo: Repository<FormResponse>;

    constructor() {
        this.formRepo = AppDataSource.getRepository(Form);
        this.formItemRepo = AppDataSource.getRepository(FormItem);
        this.formItemOptionRepo = AppDataSource.getRepository(FormItemOption);
        this.formResponseRepo = AppDataSource.getRepository(FormResponse);
    }

    getFormRepo() {
        return this.formRepo;
    }

    getFormItemRepo() {
        return this.formItemRepo;
    }

    getFormItemOptionRepo() {
        return this.formItemOptionRepo;
    }

    getFormResponseRepo() {
        return this.formResponseRepo;
    }

    createFormQueryBuilder(alias = "form") {
        return this.formRepo.createQueryBuilder(alias);
    }

    createFormItemQueryBuilder(alias = "formItem") {
        return this.formItemRepo.createQueryBuilder(alias);
    }
}
