/**
 * FileDeleteError is thrown when there is an error deleting a file.
 */
export class FileDeleteError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileDeleteError';
  }
}
