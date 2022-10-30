import * as COLORS from "https://deno.land/std@0.159.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.160.0/path/mod.ts";
import { absolutePath } from "../../src/helpers/path.ts";
import { inputDate, CLI } from "../../src/helpers/cli.ts"
import { Datetime } from "../../src/helpers/datetime.ts"

// console.log(parseInt("mm"));

// const startBefore = Datetime.createDate(new Date(), "past", { minutes: 10 });
// const startAfter = Datetime.createDate( new Date(), "past", { days: 7 });

// const startLogs = inputDate(`Pull logs from date`, { before: startBefore, after: startAfter, default: "after" });

// const endLogs = inputDate("Pull logs to date", { before: startBefore, after: startLogs as Date, default: "before" })


// console.log(COLORS.cyan(`Completed ${COLORS.green("9")} tasks in ${COLORS.green("32s")}`));

const cli = new CLI();

await cli.task("Doing something", () => {

})

await cli.task("Doing another thing", () => {

})

await cli.task("Doing a third thing", () => {})

await cli.task("Doing the fourth thing", () => {})

cli.finished()

// console.log(COLORS.cyan("[1] Task:"), "Running a task");
// console.log(COLORS.yellow("[1] Running..."));
// console.log(COLORS.green("[1] Complete \u2713"), "(32s, 42mb)");

// console.log(COLORS.green("\nCompleted:"), COLORS.underline("9 tasks"));
// for (let i = 0; i < 9; i++){
//   console.log("  \u2022 Running a task", COLORS.green("\u2713"));
// }

// console.log(COLORS.yellow("Total time:"), "32s");
// console.log(COLORS.yellow("Total memory:"), "4.2gb");

// console.log("mm/dd/yyyy hh-mm-ss".length);
// const parsed = parseInput(dateStr);
// console.log(parsed.length);
// const date = new Date(parsed)

// console.log(date);

// /**
//  * Generates absolute path given relative path
//  * @date 2022-10-26 - 4:50:01 a.m.
//  *
//  * @param {string} relativePath
//  * @returns {string}
//  */
//  const absolutePath = (relativePath: string): string =>
//  path.resolve(
//    path.dirname(path.fromFileUrl(import.meta.url)),
//    relativePath,
//  );

//  const fileExistsInDir = async (dirPath: string, fileName: string | null) : Promise<boolean> => {

//   if (fileName === null) return false;

//   const dir = Deno.readDir(dirPath);

//   for await (const d of dir){
//     if (fileName === d.name && d.isFile){
//       return true;
//     }
//   }

//   return false;
//  }

// console.log(COLORS.magenta("Cloudflare Analysis"));

// const inputFileName = async (promptString: string, promptDefault: string, directoryPath: string) => {
//   let isFile = false;
//   let fileName : string | null = "";

//   while(!isFile){
//     fileName = prompt(COLORS.cyan(promptString), promptDefault);

//     isFile = await fileExistsInDir(absolutePath(directoryPath), fileName);
//     if (!isFile) console.log(`${fileName} does not exist in ${directoryPath}`);
//   }

//   return fileName;
//  }

// // console.log(ASCII);

// let currentIsFile = false;
// let current: string | null = "";

// while(!currentIsFile){
  
//   current = prompt(COLORS.cyan("Current data file name (inside ./src/data):"), "mmddyyy.csv");

//   currentIsFile = await fileExistsInDir(absolutePath("../../src/data"), current);
//   if (!currentIsFile) console.log(COLORS.red(`${current} does not exist in ./src/data.`));
  
// }

// let prevIsFile = false;
// let prev : string | null = "";

// while(!prevIsFile){

//   prev = prompt(COLORS.cyan("Previous data file name (inside ./src/data):"), "mmddyyyy.csv");

//   prevIsFile = await fileExistsInDir(absolutePath("../../src/data"), prev);
//   if (!prevIsFile) console.log(COLORS.red(`${prev} does not exist in ./src/data`));

// }

// console.log({ current, prev });

// const current = prompt(COLORS.cyan("Current data file name (inside ./src/data):"), "mmddyyy.csv");




// console.log(current);
// console.log(currentIsFile);
// console.log("Test:", test);