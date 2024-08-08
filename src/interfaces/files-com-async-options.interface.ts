import { FilesComConfiguration } from './files-com-configuration.interface';
/**
 * FilesComAsyncOptions
 */
export interface FilesComAsyncOptions {
  // useFactory: (...args: any[]) => Promise<FilesComConfiguration | undefined>;
  useFactory?: (
    ...args: any[]
  ) => FilesComConfiguration | Promise<FilesComConfiguration>;
  inject?: any[];
}
