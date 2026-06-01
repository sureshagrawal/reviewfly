/**
 * Object/file storage adapter interface.
 *
 * - Hides backend choice (local FS for dev, R2/S3 for prod).
 * - All writes go through here. Never write to disk directly.
 *
 * Phase 0: interface only.
 */

export type UploadInput = {
  key: string; // logical path, e.g. "tenants/<id>/logo.png"
  data: Buffer | Uint8Array;
  contentType: string;
};

export type UploadResult = {
  key: string;
  publicUrl: string;
  size: number;
};

export interface StorageAdapter {
  readonly name: string;
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export class StorageError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}
