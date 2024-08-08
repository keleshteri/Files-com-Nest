/**
 * FileUploadError is thrown when there is an error uploading a file.
 */
export class FileUploadError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}
