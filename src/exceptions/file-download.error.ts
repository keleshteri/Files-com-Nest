/**
 * FileDownloadError is thrown when there is an error downloading a file.
 */
export class FileDownloadError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileDownloadError';
  }
}
