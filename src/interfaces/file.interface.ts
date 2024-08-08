/**
 * FileAttributes represents the attributes of a file.
 */
export interface FileAttributes {
  path: string; //"path/file.txt"
  display_name: string; //"file.txt",
  type: string | 'file' | 'folder'; //"file",
  size: number; //1024,
  created_at: string; //"2000-01-01T01:00:00Z",
  mtime: string; //"2000-01-01T01:00:00Z",
  provided_mtime: string; // "2000-01-01T01:00:00Z",
  crc32: string; //"70976923",
  md5: string; //"17c54824e9931a4688ca032d03f6663c",
  mime_type: string; //"application/octet-stream",
  region: string; //"us-east-1",
  permissions: string; //"rwd",
  subfolders_locked: boolean; //true,
  download_uri: string; // 'https://mysite.files.com/...';
  priority_color: string | null; //red
  preview_id: number | null; //1
  preview: {
    id: number;
    status: string | 'complete';
    download_uri: string;
    type: string;
    size: string;
  } | null;
}

/**
 * Options represents the options for a file response.
 */
interface Options {}
/**
 * FileResponse represents the response of a file request.
 */
export interface FileResponse {
  attributes: FileAttributes;
  options: Options;
}
