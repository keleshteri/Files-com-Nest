/**
 * FileMoveError is thrown when there is an error moving a file.
 */
export class FileMoveError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileMoveError';
  }
}
