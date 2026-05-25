import type { Bucket } from "@google-cloud/storage";
import { firebaseConfig } from "../../core/config/firebase";
import { getFirebaseStorageApp } from "./firebase.service";
import { logger } from "../utils/logger";
import crypto from "crypto";
import sharp from "sharp";

class StorageService {
  private bucket: Bucket | null = null;
  private initialized = false;

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Storage using the storage-only app (env credentials).
   * Notifications use a separate Firebase app (service account JSON).
   */
  private initializeFirebase(): void {
    try {
      const storageApp = getFirebaseStorageApp();
      if (!storageApp) {
        logger.warn(
          "Firebase storage not configured (set FIREBASE_* env vars for storage). Storage disabled."
        );
        return;
      }
      const bucketName = firebaseConfig.storage_bucket?.replace(/^gs:\/\//, "") || "";
      this.bucket = bucketName ? storageApp.storage().bucket(bucketName) : null;
      this.initialized = !!this.bucket;
      if (this.initialized) {
        logger.info("Firebase Storage initialized successfully (storage account)");
      }
    } catch (error) {
      logger.error("Failed to initialize Firebase Storage:", error);
      this.initialized = false;
    }
  }

  /**
   * Upload image to Firebase Storage
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = "uploads",
    options: { noCompress?: boolean } = {}
  ): Promise<{ success: boolean; message: string; url?: string; fileName?: string }> {
    try {
      if (!this.initialized || !this.bucket) {
        return {
          success: false,
          message: "Firebase Storage is not initialized",
        };
      }

      // Validate file
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error!,
        };
      }

      const isProfileImage = folder.toLowerCase().includes("profile");

      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");

      let fileBuffer: Buffer;
      let fileName: string;
      let contentType: string;

      if (options.noCompress) {
        // Keep original buffer, extension and mimetype
        const originalExtension = file.originalname.split(".").pop();
        const safeExtension = originalExtension ? `.${originalExtension}` : "";
        fileName = `${folder}/${timestamp}_${randomString}${safeExtension}`;
        fileBuffer = file.buffer;
        contentType = file.mimetype;
      } else {
        // Process image: resize if needed and convert/compress to WebP
        const processed = await this.processImageToWebP(file, {
          isProfile: isProfileImage,
        });

        // Always .webp after processing
        fileName = `${folder}/${timestamp}_${randomString}.webp`;
        fileBuffer = processed.buffer;
        contentType = "image/webp";
      }

      // Create file reference
      const fileRef = this.bucket!.file(fileName);

      // Upload file
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType,
          metadata: {
            firebaseStorageDownloadTokens: crypto.randomBytes(16).toString("hex"),
          },
        },
        public: true,
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket!.name}/${fileName}`;

      logger.info(`Image uploaded successfully: ${fileName}`);

      return {
        success: true,
        message: "Image uploaded successfully",
        url: publicUrl,
        fileName,
      };
    } catch (error) {
      logger.error("Error uploading image to Firebase:", error);
      const message = error instanceof Error ? error.message : "Failed to upload image";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = "uploads",
    options: { noCompress?: boolean } = {}
  ): Promise<{ success: boolean; message: string; urls?: string[]; files?: Array<{ url: string; fileName: string }> }> {
    try {
      if (!this.initialized || !this.bucket) {
        return {
          success: false,
          message: "Firebase Storage is not initialized",
        };
      }

      const uploadResults = await Promise.all(files.map((file) => this.uploadImage(file, folder, options)));

      const failedUploads = uploadResults.filter((result) => !result.success);

      if (failedUploads.length > 0) {
        return {
          success: false,
          message: `Failed to upload ${failedUploads.length} image(s)`,
        };
      }

      const uploadedFiles = uploadResults.map((result) => ({
        url: result.url!,
        fileName: result.fileName!,
      }));

      return {
        success: true,
        message: `${files.length} image(s) uploaded successfully`,
        urls: uploadedFiles.map((f) => f.url),
        files: uploadedFiles,
      };
    } catch (error) {
      logger.error("Error uploading multiple images:", error);
      const message = error instanceof Error ? error.message : "Failed to upload images";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  async deleteImage(fileName: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.initialized || !this.bucket) {
        return {
          success: false,
          message: "Firebase Storage is not initialized",
        };
      }

      const fileRef = this.bucket!.file(fileName);
      await fileRef.delete();

      logger.info(`Image deleted successfully: ${fileName}`);

      return {
        success: true,
        message: "Image deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting image from Firebase:", error);
      const message = error instanceof Error ? error.message : "Failed to delete image";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Validate image file
   */
  private validateImage(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size exceeds 5MB limit",
      };
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/apng",
      "image/webp",
      "image/avif",
      "image/gif",
      "image/heic",
      "image/heif",
      "image/tiff",
      "image/bmp",
      "image/jxl",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: "Invalid file type. Unsupported image format",
      };
    }

    // Check file extension
    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "apng",
      "webp",
      "avif",
      "gif",
      "heic",
      "heif",
      "tiff",
      "tif",
      "bmp",
      "jxl",
      "ico",
      "svg",
    ];
    const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: "Invalid file extension",
      };
    }

    return { isValid: true };
  }

  /**
   * Process image buffer: resize when large and convert/compress to WebP.
   * Profile images are compressed more aggressively than other images.
   */
  private async processImageToWebP(
    file: Express.Multer.File,
    options: { isProfile?: boolean; noCompress?: boolean } = {},
  ): Promise<{ buffer: Buffer }> {
    if (options.noCompress) {
      return { buffer: file.buffer };
    }
    const isProfile = options.isProfile ?? false;

    // Base sharp instance with auto rotation
    let image = sharp(file.buffer, { failOnError: false }).rotate();

    // Read metadata to determine dimensions
    const metadata = await image.metadata();

    const maxWidth = isProfile ? 800 : 1920;
    const maxHeight = isProfile ? 800 : 1920;

    // Apply resize only if dimensions are larger than the limits
    if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
      image = image.resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // WebP quality: profile images are compressed more
    const quality = isProfile ? 60 : 80;

    // Always convert to WebP for consistent storage and better compression
    image = image.webp({ quality });

    const buffer = await image.toBuffer();
    return { buffer };
  }


  /**
* Upload any file (PDF, DOCX, etc.) to Firebase Storage
*/
  async uploadFile(
    file: Express.Multer.File,
    folder: string = "uploads",
    allowedTypes: string[] = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
  ): Promise<{ success: boolean; message: string; url?: string; fileName?: string }> {
    try {
      if (!this.initialized || !this.bucket) {
        return {
          success: false,
          message: "Firebase Storage is not initialized",
        };
      }

      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        return {
          success: false,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

      // Create file reference
      const fileRef = this.bucket!.file(fileName);
      // Upload file
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: crypto.randomBytes(16).toString("hex"),
          },
        },
        public: true,
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket!.name}/${fileName}`;

      logger.info(`File uploaded successfully: ${fileName}`);

      return {
        success: true,
        message: "File uploaded successfully",
        url: publicUrl,
        fileName,
      };
    } catch (error) {
      logger.error("Error uploading file to Firebase:", error);
      const message = error instanceof Error ? error.message : "Failed to upload file";
      return {
        success: false,
        message,
      };
    }
  }

  /**
 * Get signed URL for private files (if needed in future)
 */
  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      if (!this.initialized || !this.bucket) {
        return {
          success: false,
          message: "Firebase Storage is not initialized",
        };
      }

      const fileRef = this.bucket!.file(fileName);
      const [url] = await fileRef.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 1000,
      });

      return {
        success: true,
        message: "Signed URL generated successfully",
        url,
      };
    } catch (error) {
      logger.error("Error generating signed URL:", error);
      const message = error instanceof Error ? error.message : "Failed to generate signed URL";
      return {
        success: false,
        message,
      };
    }
  }
}

export const storageService = new StorageService();
