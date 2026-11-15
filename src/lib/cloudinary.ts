import { env } from "@/env";

export function isUploadConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  duration?: number;
  resource_type?: string;
  format?: string;
}

/**
 * Uploads practice media (video or photo) directly from client to Cloudinary using an unsigned upload preset.
 * Supports mp4, mov, webm, jpg, png, webp, heic.
 */
export async function uploadPracticeMedia(
  file: File,
  options?: {
    studentId?: string;
    onProgress?: (percent: number) => void;
  },
): Promise<CloudinaryUploadResult> {
  const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary upload is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.",
    );
  }

  const isImage = file.type.startsWith("image/");
  const resourceType = isImage ? "image" : "video";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "my-piano-diary/practice");
  formData.append("resource_type", resourceType);

  if (options?.studentId) {
    formData.append("context", `student_id=${options.studentId}`);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 180_000; // 3 minutes for larger videos

    if (xhr.upload && options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(res);
        } catch {
          reject(new Error("Invalid response from Cloudinary upload"));
        }
      } else {
        let errorMsg = `Upload failed (${xhr.status})`;
        try {
          const errorJson = JSON.parse(xhr.responseText) as {
            error?: { message?: string };
          };
          if (errorJson.error?.message) {
            errorMsg = errorJson.error.message;
          }
        } catch {
          // ignore
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Cloudinary upload"));
    };

    xhr.ontimeout = () => {
      reject(new Error("Cloudinary upload timed out after 3 minutes"));
    };

    xhr.send(formData);
  });
}

// Backwards-compatible alias for existing imports
export const uploadPracticeVideo = uploadPracticeMedia;
