import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FilesComService } from './services/files-com.service';
import { FilesComAsyncOptions } from './interfaces/files-com-async-options.interface';
import { FilesComConfiguration } from './interfaces/files-com-configuration.interface';
import { FilesComApiService } from './services';
// @Global()
@Module({
  // providers: [FilesComService],
  // exports: [FilesComService],
})
export class FilesComModule {
  /**
   * validateConfiguration
   * @param config
   */
  private static validateConfiguration(config: FilesComConfiguration) {
    const { enable, baseUrl, apiKey, username, password } = config;
    console.log('enable', enable);
    if (!enable) {
      return;
    }

    console.log('baseUrl', baseUrl);

    if (!baseUrl && enable === true) {
      throw new Error('You must provide a baseUrl for Files.com');
    }

    if (!apiKey && (!username || !password) && enable === true) {
      throw new Error(
        'You must provide either an API key or both username and password for Files.com',
      );
    }
  }
  /**
   * forRoot
   * @param apiKey
   * @param username
   * @param password
   * @returns
   */
  static forRoot(config: FilesComConfiguration): DynamicModule {
    this.validateConfiguration(config);

    const providers: Provider[] = [
      {
        provide: 'FILES_COM_CONFIGURATION',
        useValue: config,
      },
      FilesComService,
      FilesComApiService,
    ];

    return {
      module: FilesComModule,
      providers: providers,
      exports: providers,
    };
  }
  /**
   * forRootAsync
   * @param options
   * @returns
   */
  static forRootAsync(options: FilesComAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      //FilesComService
      {
        provide: FilesComService,
        useFactory: async (...args: any[]): Promise<FilesComService> => {
          const config: FilesComConfiguration | undefined =
            await options.useFactory(...args);
          if (config) {
            this.validateConfiguration(config);
            return new FilesComService(config);
          } else {
            throw new Error('Failed to get configuration for Files.com');
          }
        },
        inject: options.inject || [],
      },
      //FilesComApiService
      {
        provide: FilesComApiService,
        useFactory: async (...args: any[]): Promise<FilesComApiService> => {
          const config: FilesComConfiguration | undefined =
            await options.useFactory(...args);
          if (config) {
            this.validateConfiguration(config);
            return new FilesComApiService(config);
          } else {
            throw new Error('Failed to get configuration for Files.com');
          }
        },
        inject: options.inject || [],
      },
    ];
    return {
      module: FilesComModule,
      providers: providers,
      exports: providers,
    };
  }
}
