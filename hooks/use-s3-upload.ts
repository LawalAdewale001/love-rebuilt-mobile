/**
 * useS3Upload — React Native hook for uploading files via S3 presigned POST policy.
 *
 * The backend returns a POST presigned policy (url + fields).
 * We use XMLHttpRequest so we get progress events and avoid the CORS/fetch issues
 * that plague React Native when posting multipart/form-data directly to S3.
 */

import { useRef, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

export interface S3UploadOptions {
  /** Key prefix e.g. "user-uploads/voice-notes" */
  keyPrefix?: string;
  /** Max file size in bytes (default 50 MB) */
  maxSize?: number;
}

export interface S3UploadResult {
  fileUrl: string;
  key: string;
}

export interface UseS3UploadReturn {
  upload: (uri: string, fileName: string, mimeType: string) => Promise<S3UploadResult | null>;
  progress: number; // 0-100
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export function useS3Upload(options: S3UploadOptions = {}): UseS3UploadReturn {
  const { maxSize = DEFAULT_MAX_SIZE } = options;
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (uri: string, fileName: string, mimeType: string): Promise<S3UploadResult | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // 1. Get presigned POST policy from backend
        console.log("[S3Upload] Requesting presigned URL for:", fileName);
        const response = await apiClient.post<any>("/api/upload/presigned-url", { fileName });
        const { url, fields, fileUrl, key } = response.result ?? response;

        if (!url || !fields) {
          throw new Error("Invalid presigned URL response from server");
        }

        console.log("[S3Upload] Got presigned URL. Uploading to S3...");

        // 2. Build FormData — order is CRITICAL for S3/Tigris
        const formData = new FormData();
        const existingFields = fields as Record<string, string>;
        
        // Priority fields (S3 best practice)
        if (existingFields["acl"]) {
          formData.append("acl", existingFields["acl"]);
        }

        console.log("[S3Upload] Appending fields from backend:", Object.keys(existingFields));
        Object.entries(existingFields).forEach(([k, v]) => {
          if (k !== "acl") formData.append(k, v);
        });

        if (!existingFields["Content-Type"]) {
          formData.append("Content-Type", mimeType);
        }

        // React Native FormData file blob — MUST be the last field
        formData.append("file", {
          uri,
          name: fileName,
          type: mimeType,
        } as any);

        // 3. Upload via XHR (supports progress + no CORS preflight issues on RN)
        console.log("[S3Upload] POSTing to:", url);
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.onreadystatechange = () => {
            console.log(`[S3Upload] readyState=${xhr.readyState} status=${xhr.status}`);
          };

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress(100);
              console.log("[S3Upload] Upload success:", xhr.status);
              resolve();
            } else {
              const body = xhr.responseText?.slice(0, 500) || "(empty body)";
              const msg = `S3 upload failed (${xhr.status}): ${body}`;
              console.error("[S3Upload] Error response body:", body);
              reject(new Error(msg));
            }
          });

          xhr.addEventListener("error", () => {
            const msg = `[S3Upload] network error. status=${xhr.status} response=${xhr.responseText?.slice(0, 300)}`;
            console.error(msg);
            reject(new Error("Network error during S3 upload"));
          });

          xhr.addEventListener("abort", () => {
              reject(new Error("Upload aborted"));
          });

          xhr.open("POST", url);
          xhr.send(formData);
        });

        // 4. Return sanitized result
        // We fix the double slash issue here (e.g. .com//user -> .com/user) safety measure
        const sanitizedUrl = (fileUrl as string).replace(/([^:])\/\//g, "$1/");
        console.log("[S3Upload] Final URL:", sanitizedUrl);
        
        return { fileUrl: sanitizedUrl, key: key as string };
      } catch (err: any) {
        const message: string = err?.message ?? String(err);
        console.error("[S3Upload] Error:", message);
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
        xhrRef.current = null;
      }
    },
    [maxSize]
  );

  return { upload, progress, isUploading, error, reset };
}
