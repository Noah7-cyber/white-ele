import { useCallback } from "react";
import { uploadServices } from "@/services/upload.service";
import { useMutationService } from "@/utils/hooks/useMutationService";

interface UploadDocumentsResponse {
  success?: boolean;
  message?: string;
  url?: string;
  fileName?: string;
}

const useActivityPhotoUpload = () => {
  const { mutateAsync: uploadDocumentsAsync, isPending: isUploadingPhoto } = useMutationService<
    FormData,
    UploadDocumentsResponse
  >({
    service: uploadServices.uploadImage,
    options: {
      isFormData: true,
      onSuccess: (response) => {
        if (response && typeof response === "object" && "message" in response) {
          delete (response as { message?: string }).message;
        }
      },
    },
  });

  const uploadPhoto = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "profiles");

      const response = await uploadDocumentsAsync(formData);
      const uploadedFile = response;

      if (!uploadedFile?.url) {
        throw new Error("Unable to upload photo");
      }

      return {
        url: uploadedFile.url,
        fileName: uploadedFile.fileName,
      };
    },
    [uploadDocumentsAsync],
  );

  return {
    uploadPhoto,
    isUploadingPhoto,
  };
};

export default useActivityPhotoUpload;
