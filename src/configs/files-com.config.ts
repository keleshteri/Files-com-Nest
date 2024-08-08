import { registerAs } from '@nestjs/config';

/**
 * registerAs
 */
export const FilesComConfig = registerAs(
  'files-com',
  (): Record<string, any> => ({
    enable: process.env.FILES_COM_ENABLE ?? false,
    baseUrl: process.env.FILES_COM_BASE_URL ?? 'https://propertymate.files.com',
    apiKey: process.env.FILES_COM_API_KEY,
    localStoragePath:
      process.env.localStoragePath ?? '/usr/src/app/local-storage',
  }),
);
