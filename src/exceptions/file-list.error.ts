/**
 * FileListError is thrown when there is an error listing files.
 */
export class FileListError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileListError';
  }
}
