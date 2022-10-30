import * as COLORS from "https://deno.land/std@0.159.0/fmt/colors.ts";
import { absolutePath } from "./path.ts"
import { Datetime } from "./datetime.ts";



export class CLI{
  
  private totalMemoryUsage = 0;
  private totalTime = 0;
  private tasks : string[] = []; 

  private displayElapsed = (ms: number) => {
    
    const s = Math.round( ms / 1000);
    const m = (ms / (60 * 1000)).toFixed(2);

    if (s > 60){
      return `${m}m ✨`
    }else if (s === 0){
      return `${Math.round(ms) === 0 ? ms.toFixed(2) : Math.round(ms)}ms`
    } else {
      return `${s}s`
    }
  }

  private displayMemoryUsage = (bytes: number) => {
    const mb = (bytes / 1e6).toFixed(2);
    const kb = (bytes / 1000).toFixed(2);
    const gb = (bytes / 1e9).toFixed(2);

    return `${parseInt(gb) === 0 ? parseInt(mb) === 0 ? `${kb}kb` : `${mb}mb` : `${gb}gb`}`
  }

  /**
   * Runs a callback and outputs console statements displaying status as well as completion time
   * @date 2022-10-28 - 8:29:06 p.m.
   *
   * @async
   * @param {string} description - A string describing the task
   * @param {(() => Promise<void> | void)} cb - The asynchronous callback to run
   * @returns {Promise<void> | void}
   */
  public task = async (
    description: string,
    cb: () => Promise<void> | void,
  ) => {
    this.tasks.push(description);
    const taskIdx = this.tasks.length;
    
    console.log(COLORS.cyan(`\n[${taskIdx}] Task:`), description);
    console.log(`${COLORS.yellow(`[${taskIdx}] Running...`)}`);
  
    const start = performance.now();
    const startMem = Deno.memoryUsage();
    await cb();
    const endMem = Deno.memoryUsage();
    const end = performance.now();
  
    const elapsed = end - start;
    this.totalTime += elapsed;
    
  
    const used = endMem.heapUsed - startMem.heapUsed;
    this.totalMemoryUsage += used;
    
    console.log(COLORS.green(`[${taskIdx}] Complete \u2713`), `(${this.displayElapsed(elapsed)}, ${this.displayMemoryUsage(used)})`);
  
  };

  public finished = () => {
    console.log(`${COLORS.green("\nCompleted:")} ${COLORS.underline(`${this.tasks.length} tasks`)}`);
    this.tasks.forEach( task => {
      console.log(` \u2022 ${task} ${COLORS.green("\u2713")}`);
    })
    console.log(`${COLORS.yellow("Total time:")} ${this.displayElapsed(this.totalTime)}`);
    console.log(`${COLORS.yellow("Total memory:")} ${this.displayMemoryUsage(this.totalMemoryUsage)}`);
  }

}

/**
 * Runs a callback and outputs console statements displaying status as well as completion time
 * @date 2022-10-26 - 4:25:22 a.m.
 *
 * @async
 * @param {string} description - A string describing the task
 * @param {(() => Promise<void> | void)} cb - The asynchronous callback to run
 * @returns {Promise<void>}
 */
export const task = async (
  description: string,
  cb: () => Promise<void> | void,
) => {
  console.log(
    `${COLORS.bgCyan(`${COLORS.black(`\nTask: ${description}`)}`)}`,
  );
  console.log(`${COLORS.yellow("Running Task...")}`);

  const start = performance.now();
  const startMem = Deno.memoryUsage();
  await cb();
  const endMem = Deno.memoryUsage();
  const end = performance.now();

  const elapsed = end - start;
  const s = Math.round(elapsed / 1000);

  const used = endMem.heapUsed - startMem.heapUsed;
  const mb = (used / 1e6).toFixed(2);
  const kb = (used / 1000).toFixed(2);
  const gb = (used / 1e9).toFixed(2);

  console.log(COLORS.magenta(`Memory used: ${parseInt(gb) === 0 ? parseInt(mb) === 0 ? `${kb}kb.` : `${mb}mb.` : `${gb}gb.`}`));
  console.log(
    `${
      COLORS.green(
        `Complete in ${
          s === 0 ? Math.round(elapsed) + "ms" + " ✨" : s + "s" + " ✨"
        }`,
      )
    }`,
  );
  
};


const fileExistsInDir = async (dirPath: string, fileName: string | null) : Promise<boolean> => {

  if (fileName === null) return false;

  const dir = Deno.readDir(dirPath);

  for await (const d of dir){
    if (fileName === d.name && d.isFile){
      return true;
    }
  }

  return false;
}


/**
 * Prompts user for input for a file name inside a directory. Checks if file exists in the directory and asks again
 * @date 2022-10-28 - 4:34:47 a.m.
 *
 * @async
 * @param {string} promptString - Prompt given to user
 * @param {string} promptDefault - Default value for the prompt
 * @param {string} directoryPath - Relative path to directory from caller file
 * @returns {string} - Absolute path to file
 */
export const inputFileName = async (promptString: string, directoryPath: string, promptDefault?: string)  => {
  let isFile = false;
  let fileName : string | null = "";

  while(!isFile){
    fileName = prompt(COLORS.cyan(promptString), promptDefault);

    isFile = await fileExistsInDir(absolutePath(directoryPath), fileName);
    if (!isFile) console.log(COLORS.red(`${fileName} does not exist in ${directoryPath}`));
  }

  return absolutePath(directoryPath + "/" + fileName);
}

interface inputDateOpts{
  before?: Date,
  after?: Date,
  default?: "before" | "after"
}

export const inputDate = (promptString: string, opts?: inputDateOpts) => {

  let isValid = false;
  let date : Date | null = null;

  promptString = COLORS.cyan(promptString)
  if (opts?.before){
    promptString += COLORS.yellow(`\nmust be before: ${opts.before.toLocaleString()}\n`)
  }

  if (opts?.after){
    promptString += COLORS.yellow(`${opts.before ? "" : "\n"}must be after: ${opts.after.toLocaleString()}`)
  }

  // promptString += '[yyyy-mm-dd hh:mm:ss]:'

  console.log(promptString);
  const invalid = COLORS.red("Invalid input, try again.");

  const monthDays = [
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  while(!isValid){

    const defaultDate = opts?.default === "before" ? opts?.before : opts?.after;

    const monthDefault = defaultDate?.getMonth() ? defaultDate.getMonth() + 1 : undefined;

    // Add or subtract one second to satisfy before and after requirements
    const secondDefault = defaultDate?.getSeconds() ? defaultDate.getSeconds() + (opts?.default === "after" ? 1 : -1) : undefined;

    const defaults = {
      year: defaultDate?.getFullYear().toString(),
      month: monthDefault?.toString(),
      day: defaultDate?.getDate().toString(),
      hour: defaultDate?.getHours().toString(),
      minute: defaultDate?.getMinutes().toString(),
      second: secondDefault?.toString()
    }

    const year = parseInt(prompt(COLORS.cyan("Enter year:"), defaults.year) as string)

    if (isNaN(year) || year < 0){
      console.log(invalid);
      continue;
    }

    const month = parseInt(prompt(COLORS.cyan("Enter month:"), defaults.month) as string)

    if (isNaN(month) || month < 1 || month > 12){
      console.log(invalid);
      continue;
    }

    const day = parseInt(prompt(COLORS.cyan("Enter day:"), defaults.day) as string);

    if (isNaN(day) || day < 1 || day > monthDays[month - 1]){
      console.log(invalid);
      continue;
    }

    const hour = parseInt(prompt(COLORS.cyan("Enter hour:"), defaults.hour) as string);
    if (isNaN(hour) || hour < 0 || hour > 23){
      console.log(invalid);
      continue;
    }

    const minute = parseInt(prompt(COLORS.cyan("Enter minute:"), defaults.minute) as string);

    if (isNaN(minute) || minute < 0 || minute > 59){
      console.log(invalid);
      continue
    }

    const second = parseInt(prompt(COLORS.cyan("Enter second:"), defaults.second) as string);

    if (isNaN(second) || second < 0 || second > 59){
      console.log(invalid);
      continue
    }

    

    date = new Date(year, month - 1, day, hour, minute, second);
    if (!date){
      console.log(COLORS.red("Invalid input, try again."));
      continue;
    }

    if (opts){
      if (opts.before && opts.after){
        if (!Datetime.isInBetween(date, opts.after, opts.before)){
          console.log(COLORS.red("Date does not satisfy requirements, try again."));
          continue;
        }
      } else if (opts.before && !opts.after){
        // something
        if (!Datetime.isInBetween(date, new Date(0), opts.before)){
          console.log(COLORS.red("Date does not satisfy requirements, try again."));
        }
      } else if (!opts.before && opts.after){
        // something
        if (!Datetime.isInBetween(date, opts.after, new Date())){
          console.log(COLORS.red("Date does not satisfy requirements, try again."));
          continue;
        }
      }
    }

    console.log(COLORS.blue(`Selected date:`), date?.toLocaleString());


    isValid = confirm(COLORS.yellow("Is this correct?"));

  }


  

  return date;

}

