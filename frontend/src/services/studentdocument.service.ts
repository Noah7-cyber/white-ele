/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// UPLOAD ROOT
// ========================
const uploadRoot = "/api/v1/student-documents";

// ========================
// TYPES
// ========================

// ---- Base Uploaded File Model ----
export interface UploadedFile {
  url: string;
  fileName: string;
  folder?: string;
  size?: number;
  mimeType?: string;
  [key: string]: any;
}

// ---- Upload Single Image ----
export interface UploadImageRequest {
  image: File; // form-data field: "image"
  folder: string; // e.g. "profiles"
}

export interface UploadImageResponse {
  status: string;
  message: string;
  url?: string;
  data: UploadedFile;
}

// ---- Upload Multiple Images ----
export interface UploadImagesRequest {
  images: File[]; // form-data field: "images"
  folder: string; // e.g. "properties"
}

export interface UploadImagesResponse {
  status: string;
  message: string;
  data: UploadedFile[];
}

// ---- Delete Image ----
export interface DeleteDocumentRequest {
  fileName: string; // e.g. "profiles/1761126651270_c9b66064ed68d237.png"
  id?: string; // optional document id
}

export interface DeleteDocumentResponse {
  status: string;
  message: string;
  deleted?: boolean;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const deleteEndpoints = {
  uploadImage: { path: `${uploadRoot}/image`, method: ApiMethods.POST },
  uploadDocument: { path: `${uploadRoot}/document`, method: ApiMethods.POST },
  uploadImages: { path: `${uploadRoot}/images`, method: ApiMethods.POST },
  uploadDocuments: { path: `${uploadRoot}/documents`, method: ApiMethods.POST },
  deleteImage: { path: `${uploadRoot}/image`, method: ApiMethods.DELETE },
};

export const studentDocumentDynamicEndpoints = {
  deleteDocument: (documentId: string | number) => ({
    path: `${uploadRoot}/${documentId}`,
    method: ApiMethods.DELETE,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<
  T extends Record<string, { path: string; method: ApiMethods }>
>(endpoints: T) {
  const services: Record<keyof T, ServiceInterface> = {} as any;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

// ========================
// EXPORTS
// ========================
export const documentServices = generateServices(deleteEndpoints);
