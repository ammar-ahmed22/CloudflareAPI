export interface CloudflareParams {
  baseURL: string;
  headers: Record<string, string>;
}

export interface CloudflareLogs {
  start: Date;
  end: Date;
  data: Row[];
}
