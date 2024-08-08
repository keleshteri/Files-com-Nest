import { FileAttributes } from './file.interface';

/**
 * ListFilesConfig represents the configuration options for listing files.
 */
export type ListFilesConfig = {
  directoryPath: string;
  sort_by?: {
    field: keyof FileAttributes;
    direction: 'asc' | 'desc';
  };
  excludeZeroSize?: boolean;
};
