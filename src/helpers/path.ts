import * as path from "https://deno.land/std@0.160.0/path/mod.ts";

/**
 * Generates absolute path given relative path
 * @date 2022-10-26 - 4:50:01 a.m.
 *
 * @param {string} relativePath
 * @returns {string}
 */
export const absolutePath = (relativePath: string): string => {

  const __dirname = getDirectoryPathAtCaller();
  if (!__dirname){
    throw "unknown error occured getting __dirname"
  }

  return path.resolve(
    __dirname,
    relativePath,
  );
}
  

/**
 * Hacky way to gets absolute directory path at the caller file
 * @date 2022-10-28 - 3:41:35 a.m.
 *
 * @returns {string} - absolute path
 */
const getDirectoryPathAtCaller = (): string | undefined => {
  const err = new Error();
  const lineNumberRegex = /:\d+:\d+/;
  const atFileRegex = /at file:\/\//;
  const atAsyncFileRegex = /at async file:\/\//;

  // getting absolute directory path at last caller from stack trace
  const topStack = err.stack?.split("\n").at(-1)?.trim();
  const removedAtFile = atFileRegex.test(topStack as string) ? topStack?.replace(atFileRegex, "") : topStack?.replace(atAsyncFileRegex, "");
  const removedLineNumber = removedAtFile?.replace(lineNumberRegex, "");
  const result = removedLineNumber?.split("/").slice(0, -1).join("/");
  

  return result;
  
};
