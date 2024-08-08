/**
 * FileDownloadToDiskError is thrown when there is an error downloading a file to disk.
 */
export class FileDownloadToDiskError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileDownloadToDiskError';
  }
}
