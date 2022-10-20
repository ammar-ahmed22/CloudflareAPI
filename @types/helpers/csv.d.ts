type csvToJSONOpts = {
  csvPath: string,
  exportPath: string,
  headers: string[],
  cast?: (columnValue: string, ctx: CastingContext) => any;
}