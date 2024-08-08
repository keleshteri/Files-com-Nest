import { Inject, Injectable, Logger } from '@nestjs/common';
import Files from 'files.com/lib/Files.js';
import Folder from 'files.com/lib/models/Folder.js';
import File from 'files.com/lib/models/File.js';
import Session from 'files.com/lib/models/Session.js';
import { LogLevel } from 'files.com/lib/Logger.js';
import { FilesComConfiguration } from '../interfaces/files-com-configuration.interface';
import { FileResponse, IFilesComService, ListFilesConfig } from '../interfaces';
import { Writable } from 'stream';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  FileDeleteError,
  FileDownloadError,
  FileUploadError,
  FolderListError,
} from '../exceptions';

/**
 * FilesComService
 */
@Injectable()
export class FilesComService implements IFilesComService {
  private readonly logger = new Logger(FilesComService.name);
  constructor(
    @Inject('FILES_COM_CONFIGURATION')
    private config: FilesComConfiguration,
  ) {
    Files.setBaseUrl(config.baseUrl);
    Files.setLogLevel(LogLevel.INFO);
    Files.configureNetwork({
      // max retries (default: 3)
      maxNetworkRetries: 3,

      // minimum delay in seconds before retrying (default: 0.5)
      minNetworkRetryDelay: 0.5,

      // max delay in seconds before retrying (default: 1.5)
      maxNetworkRetryDelay: 1.5,

      // network timeout in seconds (default: 30.0)
      networkTimeout: 30.0,

      // auto-fetch all pages when results span multiple pages (default: `true`)
      autoPaginate: true,
    });
    if (config.apiKey) {
      this.authenticateWithApiKey(config.apiKey);
    } else if (config.username && config.password) {
      this.authenticateWithSession(config.username, config.password);
    }
  }

  /**
   * authenticateWithApiKey
   * @param apiKey
   */
  async authenticateWithApiKey(apiKey: string): Promise<void> {
    Files.setApiKey(apiKey);
  }

  /**
   * authenticateWithSession
   * @param username
   * @param password
   * @returns
   */
  async authenticateWithSession(
    username: string,
    password: string,
  ): Promise<string> {
    const session = await Session.create({ username, password });
    Files.setSessionId(session.id);
    return session.id;
  }

  fileExists(path: string): Promise<boolean> {
    throw new Error(`Method not implemented: fileExists(${path})`);
  }
  createDirectory(path: string): Promise<void> {
    throw new Error(`Method not implemented: createDirectory(${path})`);
  }

  /**
   * Lists the files in the root folder.
   * @returns A promise that resolves to an array of files in the root folder.
   * @throws FolderListError if there is an error listing the files.
   */
  async listDirectories(path: string): Promise<FileResponse[]> {
    try {
      const directorieOrfiles = await Folder.listFor(path);
      //filter type directory
      const directories = await directorieOrfiles.filter(
        (item: FileResponse) => item.attributes.type === 'directory',
      );
      return directories;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FolderListError(
          `Error listing files in root folder: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('listRootFolder: An unknown error occurred', error);
      }
    }
  }

  /**
   * Uploads a file to a specific path.
   * @param file - The file to upload.
   * @param path - The path where the file should be uploaded.
   * @returns A promise that resolves to the path of the uploaded file.
   * @throws FileUploadError if there is an error uploading the file.
   */
  async uploadFile(file: string, path: string): Promise<string> {
    try {
      const uploadedFilePath = await Files.uploadFile(file, path);
      return uploadedFilePath;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FileUploadError(
          `Error uploading file to path ${path}: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('uploadFile: An unknown error occurred', error);
      }
    }
  }

  /**
   * Lists files in a directory.
   *
   * @param directoryPath - The path of the directory.
   * @param sort_by - Optional sorting configuration.
   * @param sort_by.field - The field to sort by.
   * @param sort_by.direction - The sorting direction ('asc' or 'desc').
   * @param excludeZeroSize - Whether to exclude files with zero size (default: true).
   * @returns A promise that resolves to an array of FileResponse objects, or null if no files are found.
   * @throws Error if the directoryPath is not provided or is invalid, or if there is an error listing the files.
   */
  async listFiles({
    directoryPath,
    sort_by,
    excludeZeroSize,
  }: ListFilesConfig): Promise<FileResponse[] | null> {
    if (!directoryPath) {
      throw new Error('Either path or folder must be provided in the config');
    }

    const normalizedPath = directoryPath.trim();

    if (!normalizedPath) {
      throw new Error('Invalid path or folder provided in the config');
    }

    try {
      const items: FileResponse[] = await Folder.listFor(normalizedPath);
      if (!items || items.length === 0) {
        return null; //  throw new Error('No files found in the provided folder path'); | []
      }

      //filter
      let filteredItems = items;
      if (excludeZeroSize) {
        filteredItems = items.filter((item) => item.attributes.size > 0);
      }
      //sort
      if (sort_by) {
        const { field, direction } = sort_by;
        filteredItems.sort((a, b) => {
          if (a[field] > b[field]) {
            return direction === 'asc' ? 1 : -1;
          } else if (a[field] < b[field]) {
            return direction === 'asc' ? -1 : 1;
          }
          return 0;
        });
      }
      return filteredItems;
      // return filteredItems.map((item) => item.attributes.display_name);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Error listing files from Files.com for path ${normalizedPath}: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('An unknown error occurred', error);
      }
    }
  }

  /**
   * Downloads a file and returns it as a string.
   * @param identifier - The identifier of the file to download.
   * @returns A promise that resolves to the downloaded file as a string.
   * @throws FileDownloadError if there is an error downloading the file.
   */
  async downloadFileAsString(filePath: string): Promise<string> {
    try {
      const foundFile = await File.find(filePath);
      const downloadableFile = await foundFile.download();
      return downloadableFile.downloadToString();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Error downloading file from Files.com for path ${filePath}: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('An unknown error occurred', error);
      }
    }
  }
  /**
   * Downloads a file and writes it to a stream.
   * @param identifier - The identifier of the file to download.
   * @param writableStream - The stream to write the downloaded file to.
   * @returns A promise that resolves when the file has been downloaded and written to the stream.
   * @throws FileDownloadError if there is an error downloading the file.
   */
  async downloadFileToStream(
    identifier: string,
    writableStream: Writable,
  ): Promise<void> {
    try {
      this.logger.log(
        `Downloading file from Files.com for identifier ${identifier}`,
      );
      const foundFile = await File.find(identifier);
      this.logger.log(
        `file found: ${foundFile.display_name} size: ${foundFile.size}`,
      );

      await foundFile.downloadToStream(writableStream);
      this.logger.log(`file downloaded ${foundFile.display_name}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FileDownloadError(
          `Error downloading file from Files.com for identifier ${identifier}: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('An unknown error occurred', error);
      }
    }
  }
  /**
   * Downloads a file and saves it to a local path.
   * @param identifier - The identifier of the file to download.
   * @param localStoragePath - The local path where the file should be saved.
   * @returns A promise that resolves to the local path of the downloaded file.
   * @throws FileDownloadToDiskError if there is an error downloading the file to disk.
   */
  async downloadFileToDisk(
    filePath: string,
    localStoragePath: string,
  ): Promise<string> {
    {
      try {
        if (!localStoragePath) {
          throw new Error('localStoragePath is required');
        }

        this.logger.log('downloadFileOnDiskByPath works');
        if (!existsSync(localStoragePath)) {
          mkdirSync(localStoragePath, { recursive: true });
        }
        this.logger.log(`Downloading file from Files.com for path ${filePath}`);
        const foundFile = await File.find(filePath);
        if (!foundFile) {
          throw new Error(`File not found at path: ${filePath}`);
        }
        this.logger.log(
          `file found: ${foundFile.display_name} size: ${foundFile.size}`,
        );
        const localFilePath = join(localStoragePath, foundFile.display_name);

        const downloadableFile = await foundFile.download();
        this.logger.log(`file downloaded ${downloadableFile.display_name}`);
        await downloadableFile.downloadToFile(localFilePath);
        this.logger.log(`File downloaded and saved to ${localFilePath}`);
        return localFilePath;
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(
            `Error downloading file from Files.com for path ${filePath}: ${error.message}`,
          );
        } else {
          // Handle non-Error objects
          this.logger.error('An unknown error occurred', error);
        }
      }
    }
  }
  /**
   * Move a file to a new destination
   * @param currentPath - Current path of the file
   * @param destination - The new destination where the file should be moved
   */
  async moveFile(currentPath: string, destination: string): Promise<void> {
    try {
      const file = await File.find(currentPath);
      await file.move({ destination });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Error moving file from ${currentPath} to ${destination} on Files.com: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('An unknown error occurred', error);
      }
    }
  }

  /**
   * Deletes a file.
   * @param identifier - The identifier of the file to delete.
   * @returns A promise that resolves when the file has been deleted.
   * @throws FileDeleteError if there is an error deleting the file.
   */
  async deleteFile(identifier: string): Promise<void> {
    try {
      await Files.deleteFile(identifier);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FileDeleteError(
          `Error deleting file with identifier ${identifier}: ${error.message}`,
        );
      } else {
        // Handle non-Error objects
        this.logger.error('deleteFile: An unknown error occurred', error);
      }
    }
  }
}
