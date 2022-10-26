type csvValue = boolean | string | number | Date | null;

type Row = Record<string, csvValue>;

interface CSVFromFileOpts {
  omitColumns?: string[];
  delimiter?: string;
  castValue?: (value: string, columnName: string) => csvValue;
  castHeader?: (header: string) => string;
}

interface CSVFilterOpts {
  inplace?: boolean;
}

interface ICSV {
  rows: Row[] | undefined;
  headers: string[] | undefined;
}
