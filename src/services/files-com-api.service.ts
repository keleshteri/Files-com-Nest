import { Inject, Injectable, Logger } from '@nestjs/common';
import { FilesComConfiguration } from '../interfaces/files-com-configuration.interface';
import axios from 'axios';
// import { createWriteStream, promises as fsPromises } from 'fs';
import { createWriteStream } from 'fs';
// import { pipeline } from 'stream';
// import { promisify } from 'util';

/**
 * FilesComApiService
 */
@Injectable()
export class FilesComApiService {
  private readonly logger = new Logger(FilesComApiService.name);
  // private readonly pipeline = promisify(pipeline);

  constructor(
    @Inject('FILES_COM_CONFIGURATION')
    private config: FilesComConfiguration,
  ) {
    axios.defaults.headers.common['X-FilesAPI-Key'] = this.config.apiKey;
  }

  /**
   * requestFile
   * @param filePath
   * @returns
   */
  private async requestFile(filePath: string) {
    const response = await axios.get(
      `https://app.files.com/api/rest/v1/files/${filePath}`,
    );
    return response.data;
  }

  /**
   * Downloads a file from Files.com and returns a Readable Stream.
   * @param filePath The path of the file to download.
   * @returns A Promise that resolves to a Readable Stream of the file.
   */
  async downloadToStream(filePath: string): Promise<any> {
    if (!filePath) {
      throw new Error(`${FilesComApiService.name} is missing a file path`);
    }

    try {
      const fileData = await this.requestFile(filePath);
      const responseFile = await axios.get(fileData.data.download_uri, {
        responseType: 'stream',
      });

      return responseFile.data;
    } catch (error) {
      this.logger.error(`Error downloading file: ${error}`);
      throw error;
    }
  }
  /**
   * download
   * @param filePath
   * @param fileName
   * @returns
   */
  async download(
    filePath: string,
    localStoragePath: string = '/usr/src/app/xml-downloads',
  ): Promise<string> {
    if (!filePath) {
      throw new Error(
        `${FilesComApiService.name} is missing a file path or file name`,
      );
    }
    try {
      const fileData = await this.requestFile(filePath);
      const responseFile = await axios.get(fileData.download_uri, {
        responseType: 'stream',
      });
      const filePathLocal = `${localStoragePath}/${fileData.display_name}`;
      const writeStream = createWriteStream(filePathLocal);
      // await this.pipeline(responseFile.data, writeStream);

      await responseFile.data.pipe(writeStream);
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      return filePathLocal;
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`Error downloading file: ${error}`);
      throw error;
    }
  }

  /**
   * listFoldersByPath
   * @param path
   * @returns
   */
  async listFoldersByPath(filePath: string): Promise<any[] | false> {
    if (!filePath) {
      throw new Error(FilesComApiService.name + ' is missing a file path');
    }

    try {
      const response = await axios.get(
        `https://app.files.com/api/rest/v1/folders/${filePath}`,
        {
          headers: {
            'X-FilesAPI-Key': this.config.apiKey as string,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return false;
    }
  }

  /**
   * moveFile
   * @param fileName
   * @param pathFrom
   * @param pathTo
   * @returns
   */
  async moveFile(
    fileName: string,
    filePath: string,
    filePathTo: string,
  ): Promise<boolean> {
    try {
      await axios.post(
        `https://app.files.com/api/rest/v1/file_actions/move/${filePath}/${fileName}`,
        {
          destination: `${filePathTo}/${fileName}`,
        },
        {
          headers: {
            'X-FilesAPI-Key': this.config.apiKey as string,
          },
        },
      );
      return true;
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return false;
    }
  }

  /**
   * uploadCSVFile
   * @param content
   * @param filePathDestination
   * @param fileName
   */
  async uploadCSVFile(
    content: string,
    filePathDestination: string,
    fileName: string,
  ) {
    try {
      const buf: Buffer = Buffer.from(content, 'utf8');
      const contentLength = Buffer.byteLength(content, 'utf8');
      const blob = new Blob([new Uint8Array(buf.buffer)], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('upload-file', blob, fileName);

      const startUploadResponse = await axios.post(
        `https://app.files.com/api/rest/v1/files/${filePathDestination}/${fileName}`,
        {
          action: `put`,
        },
      );

      await axios.put(startUploadResponse?.data?.upload_uri, formData, {
        headers: {
          'Content-Length': contentLength,
          'Content-Type': 'tapplication/x-www-form-urlencoded',
        },
        maxContentLength: 200 * 1024 * 1024, // 200 MB in bytes
      });

      await axios.post(
        `https://app.files.com/api/rest/v1/files/${filePathDestination}/${fileName}`,
        {
          action: `end`,
          ref: startUploadResponse?.data?.ref,
        },
      );
    } catch (err) {
      this.logger.error(`Error uploading CSV file: ${err}`);
      throw err;
    }
  }
}
