import { FormStatus } from "../shared/entities/EntityEnums";

export interface CreateItemDTO {
    title: string;
    type: any;
    isRequired: boolean;
    imageUrls?: string[];
    order?: number;
    options?: { label: string; order?: number }[];
}

export interface UpdateItemDTO {
    title?: string;
    type?: any;
    isRequired?: boolean;
    imageUrls?: string[] | null;
    order?: number;
    options?: { label: string; order?: number }[];
}

export interface BulkUpdateItemDTO extends UpdateItemDTO {
    id: number;
}

export type SyncFormItemDTO = Partial<CreateItemDTO> & { id?: number };

export interface UpdateFormDTO {
    title?: string;
    description?: string;
    status?: FormStatus;
    slug?: string;
    items?: SyncFormItemDTO[];
}

export interface CreateFormDTO {
    title: string;
    description?: string;
    schoolId: number;
    status?: FormStatus;
    questions?: CreateItemDTO[];
}

export interface FormFilters {
    schoolId?: number;
    formId?: number;
    userId?: number;
}
