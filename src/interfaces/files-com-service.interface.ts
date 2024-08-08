/**
 * IFilesComService
 */
import { FileResponse } from './file.interface';
import { ListFilesConfig } from './list-files-config.interface';
import { Writable } from 'stream';

/**
 * IFilesComService represents the interface for a service that interacts with Files.com.
 */
export interface IFilesComService {
  /**
   * Uploads a file to Files.com.
   * @param file - The file to upload.
   * @param path - The path where the file should be uploaded.
   * @returns A promise that resolves when the file has been uploaded.
   */
  uploadFile(file: string | Buffer, path: string): Promise<string>;

  /**
   * Downloads a file and returns it as a string.
   * @param identifier - The identifier of the file to download.
   * @returns A promise that resolves to the downloaded file as a string.
   * @throws FileDownloadError if there is an error downloading the file.
   */
  downloadFileAsString(identifier: string): Promise<string>;
  /**
   * Downloads a file and writes it to a stream.
   * @param identifier - The identifier of the file to download.
   * @param writableStream - The stream to write the downloaded file to.
   * @returns A promise that resolves when the file has been downloaded and written to the stream.
   * @throws FileDownloadError if there is an error downloading the file.
   */
  downloadFileToStream(
    identifier: string,
    writableStream: Writable,
  ): Promise<void>;

  /**
   * Moves a file to a new path on Files.com.
   * @param path - The current path of the file.
   * @param destinationPath - The path where the file should be moved.
   * @returns A promise that resolves when the file has been moved.
   */
  moveFile(path: string, destinationPath: string): Promise<void>;

  /**
   * Deletes a file from Files.com.
   * @param identifier - The identifier of the file to delete.
   * @returns A promise that resolves when the file has been deleted.
   */
  deleteFile(identifier: string): Promise<void>;

  /**
   * Lists files based on the provided configuration.
   * @param config - The configuration options for listing files.
   * @returns A promise that resolves to an array of file responses, or null if no files are found.
   */
  listFiles(config: ListFilesConfig): Promise<FileResponse[] | null>;

  /**
   * Downloads a file and saves it to a local path.
   * @param identifier - The identifier of the file to download.
   * @param localStoragePath - The local path where the file should be saved.
   * @returns A promise that resolves to the local path of the downloaded file.
   * @throws FileDownloadToDiskError if there is an error downloading the file to disk.
   */
  downloadFileToDisk(
    identifier: string,
    localStoragePath: string,
  ): Promise<string>;

  fileExists(path: string): Promise<boolean>;
  createDirectory(path: string): Promise<void>;
  listDirectories(path: string): Promise<FileResponse[]>;
}
