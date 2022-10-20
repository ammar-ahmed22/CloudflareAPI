interface CloudflareParams {
  baseURL: string;
  headers: Record<string, string>;
}

interface CloudflareLogs {
  start: Date,
  end: Date,
  data: object[]
}