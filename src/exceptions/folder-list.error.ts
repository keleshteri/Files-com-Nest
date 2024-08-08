/**
 * FolderListError is thrown when there is an error listing the files in a folder.
 */
export class FolderListError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FolderListError';
  }
}
