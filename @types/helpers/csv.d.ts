export type csvValue = boolean | string | number | Date | null;

export type Row = Record<string, csvValue>;

export interface CSVFromFileOpts {
  omitColumns?: string[];
  delimiter?: string;
  castValue?: (value: string, columnName: string) => csvValue;
  castHeader?: (header: string) => string;
}

export interface CSVInplaceOpts {
  inplace?: boolean;
}

export interface ICSV {
  rows: Row[] | undefined;
  headers: string[] | undefined;
}
