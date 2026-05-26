/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutationService } from "./useMutationService";
import client, { ApiMethods } from "../client";
import { uploadServices } from "@/services/upload.service";

export function useImageUpload() {
  const { mutateAsync: mutateAvatar, isPending: isUploading } =
    useMutationService({
      service: uploadServices?.uploadImage,
      options: { isFormData: true },
    });
  async function deleteImage(url: string) {
    await client.request(uploadServices?.deleteImage);
  }

  const upLoadImage = async (event: any, folder: string, url?: string) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);
    try {
      const data: any = await mutateAvatar(formData);
      if (url) {
        deleteImage(url);
      }

      return data?.url || "";
    } catch (error) {
      console.error("Error:", error);
      return new Promise((_, reject) => {
        reject(error);
      });
    }
  };

  return { isUploading, upLoadImage };
}
