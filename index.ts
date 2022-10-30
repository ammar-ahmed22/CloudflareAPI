import { config } from "https://deno.land/std@0.160.0/dotenv/mod.ts";
const env = await config();
import * as COLORS from "https://deno.land/std@0.159.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.160.0/path/mod.ts";
import { Cloudflare } from "./src/api/cloudflare.ts";
import type { CloudflareLogs } from "./@types/api/cloudflare.d.ts";
import { Datetime } from "./src/helpers/datetime.ts";
import { CSV } from "./src/helpers/csv.ts";
import type { csvValue, CSVInplaceOpts, CSVFromFileOpts, Row } from "./@types/helpers/csv.d.ts"
import { task, inputFileName, inputDate, CLI } from "./src/helpers/cli.ts";
import { absolutePath } from "./src/helpers/path.ts"
import "./src/helpers/string.ts";


const cli = new CLI();

console.log(COLORS.magenta("Cloudflare Analysis"));

const currentFilePath = await inputFileName(
  "Current data file name (inside ./src/data):",
  "./src/data",
  // "mmddyyyy.csv",
);

const prevFilePath = await inputFileName(
  "Previous data file name (inside ./src/data):",
  "./src/data",
  // "mmddyyyy.csv",
)

const startBefore = Datetime.createDate(new Date(), "past", { minutes: 10 });
const startAfter = Datetime.createDate( new Date(), "past", { days: 7 });

const startLogs = inputDate("\nPull logs FROM:", {
  before: startBefore,
  after: startAfter,
  default: "after"
})

const endLogs = inputDate("\nPull logs TO:", {
  before: startBefore,
  after: startLogs as Date,
  default: "before"
})

console.log(Deno.memoryUsage());
// console.log({ currentFilePath });

const currentCSV = new CSV();
const prevCSV = new CSV();

await cli.task("Read and parse competitor data files", async () => {
  const opts : CSVFromFileOpts = {
    omitColumns: ["tags"],
    castValue: (val: string, cn: string) : csvValue => {
      
      if (cn === "CompetitorPrice"){
        return parseFloat(val);
      }

      if (cn === "UpdateTime"){
        return new Date(val);
      }

      return val
    },
    castHeader: (header: string) : string => {

      if (header === "ourCustomSKU"){
        return "SKU"
      }

      if (header === "competitor_price"){
        return "CompetitorPrice"
      }

      if (header === "updated_at_est_time"){
        return "UpdateTime"
      }

      return header;
    }
  }

  await currentCSV.fromFile(currentFilePath, opts);
  await prevCSV.fromFile(prevFilePath, opts);
}) 


const productCSV = new CSV();

await cli.task("Read and parse latest internal product data", async () => {
  const opts : CSVFromFileOpts = {
    castValue: (value: string, cn: string): csvValue => {
      if (cn === "Price") {
        return parseFloat(value);
      }

      // Path is given as URL, parsing to only product path
      if (cn === "Path") {
        const urlParts = value.split("/");
        const productURLPart = urlParts[urlParts.length - 1];
        return productURLPart.split("?")[0];
      }

      return value;
    },
    castHeader: (header: string): string => {
      if (header.includes("SKU")) {
        return "SKU";
      }

      if (header.includes("Price")) {
        return "Price";
      }

      if (header.includes("LandingPage")) {
        return "Path";
      }

      return header;
    },
  }
  await productCSV.fromFile(absolutePath("./src/data/latest-product-data.csv"), opts);
})

let withPriceDrop = new CSV();
await cli.task("Add 'PriceDrop' column to current competitor data", () => {
  withPriceDrop = currentCSV.addColumns("PriceDrop", (row : Row) => {
    const prevRow : Row | null = prevCSV.getRowFromValue("SKU", row.SKU);
    let priceDrop = null;
    if (prevRow){
      if (typeof row.CompetitorPrice === "number" && typeof prevRow.CompetitorPrice === "number"){
        priceDrop = prevRow.CompetitorPrice - row.CompetitorPrice;
      }
    }

    row.PriceDrop = priceDrop;
    return row;
  })
})


let priceDropped = new CSV();
await cli.task("Filter only price dropped competitor products", () => {
  priceDropped = withPriceDrop.filter((row: Row) => {
    if (typeof row.PriceDrop === "number"){
      if (row.PriceDrop > 0) return true;
    }

    return false
  })
})

let withOurPriceDrop = new CSV();
await cli.task("Add 'OurPriceDrop' column to price dropped competitor products", () => {
  withOurPriceDrop = priceDropped.addColumns("OurPriceDrop", (row: Row) => {
    const ourRow = productCSV.getRowFromValue("SKU", row.SKU);
    let ourPriceDrop = null;
    if (ourRow){
      if (typeof ourRow.Price === "number" && typeof row.CompetitorPrice === "number"){
        ourPriceDrop = ourRow.Price - row.CompetitorPrice;
      }
    }

    row.OurPriceDrop = ourPriceDrop;
    return row;
  })
})

let ourPriceDropped = new CSV();
await cli.task("Filter only our price dropped and their price dropped", () => {
  ourPriceDropped = withOurPriceDrop.filter((row: Row) => {
    if (typeof row.OurPriceDrop === "number"){
      if (row.OurPriceDrop > 0) return true;
    }
    return false
  })
})

let ourPriceDroppedWithPath = new CSV();
await cli.task("Add path to our price and their price dropped CSV", () => {
  ourPriceDroppedWithPath = ourPriceDropped.addColumns("Path", (row: Row) => {
    const productRow = productCSV.getRowFromValue("SKU", row.SKU);
    let path = null;
    if (productRow){
      if (row.SKU === productRow.SKU){
        path = productRow.Path;
      }
    }

    row.Path = path;
    return row;
  })
})



const cf = new Cloudflare({
  baseURL: `${env.CF_API_BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
    "X-Auth-Email": `${env.CF_AUTH_EMAIL}`,
    "X-Auth-Key": `${env.CF_API_KEY}`,
  },
});

const end = Datetime.createDate(new Date(), "past", { minutes: 10 });
const start = Datetime.createDate(end, "past", { days: 1 });

let logs: CloudflareLogs;
const fields = [
  "ClientIP",
  "ClientASN",
  "ClientCountry",
  "ClientDeviceType",
  "ClientIPClass",
  "ClientRequestMethod",
  "ClientRequestPath",
  "ClientRequestURI",
  "ClientRequestUserAgent",
  "EdgePathingSrc",
  "EdgePathingStatus",
  "RayID",
];

await cli.task(`Get Cloudflare logs from: ${startLogs?.toLocaleString()} to: ${endLogs?.toLocaleString()}`, async () => {
  logs = await cf.logs(startLogs as Date, endLogs as Date, fields);
});


const logsCSV = new CSV();
let productLogs = new CSV();

await cli.task("Create CSV from logs and filter by products", () => {
  logsCSV.create({ headers: fields, rows: logs.data });
  productLogs = logsCSV.filter(( row: Row ) => {
    if (typeof row.ClientRequestPath === "string"){
      if (row.ClientRequestPath.includes("product")) return true;
    }
    return false;
  })
})
console.log(productLogs.size());
await cli.task("Filter logs for products with price drop", () => {
  productLogs.filter((row: Row) => {
    
    if (ourPriceDroppedWithPath.rows){
      for (let i = 0; i < ourPriceDroppedWithPath.rows.length; i++){
        const priceDropRow = ourPriceDroppedWithPath.rows[i];
        if (typeof row.ClientRequestPath === "string"){
          if (row.ClientRequestPath.includes(priceDropRow.Path as string)) return true;
        }
      }
    }

    return false
  }, { inplace: true })
})


let withLogCount = new CSV();
await cli.task("Count logs for each product by adding new column", () => {
  withLogCount = ourPriceDroppedWithPath.addColumns("LogCount", (row: Row) => {
    let logCount = null;
    const logRows : Row[] = productLogs.getRowsFromMatch((lRow: Row) => {

      if (typeof row.Path === "string" && typeof lRow.ClientRequestPath === "string"){
        if (lRow.ClientRequestPath.includes(row.Path)) return true;
      }

      return false;
    })

    //console.log(logRow);

    row.LogCount = logRows.length;
    return row;
  })
})

let highLogs = new CSV();

await cli.task("Filter products by high log count", () => {
  highLogs = withLogCount.filter((row: Row) => {

    if (typeof row.LogCount === "number"){
      if (row.LogCount >= 1000){
        return true
      }
    }

    return false
  })
})

let highLogsWithUniqueIPs = new CSV();

await cli.task("Add Unique IP count, highest request IP and high request IP count to high logs CSV", () => {
  highLogs.addColumns(["UniqueIPCount", "HighestRequestsIP", "HighestRequestsIPCount"], (row: Row) => {

    const hash : Record<string, number> = {}
    const path = row.Path as string;
    const logs = productLogs.filter((lRow: Row) => {
      const CRPath = lRow.ClientRequestPath as string;
      if (CRPath.includes(path)) return true;
      return false
    })

    let maxIPCount = 0;
    let maxIP = "";

    if (logs.rows){
      for (let i = 0; i < logs.rows.length; i++){
        const lRow = logs.rows[i];
        const ip = lRow.ClientIP as string;
        if (hash[ip]){
          hash[ip]++
          maxIPCount = Math.max(maxIPCount, hash[ip])
          if (maxIPCount === hash[ip]){
            maxIP = ip;
          }
        } else {
          hash[ip] = 1;
        }
      }
    }

    //console.log(hash, maxIP);

    row.UniqueIPCount = Object.keys(hash).length;
    row.HighestRequestsIP = maxIP;
    row.HighestRequestsIPCount = maxIPCount;
    return row;
  }, { inplace: true })

  
})

await cli.task("Find any IPs with highest requests to multiple products, add boolean column", () => {
  const hash : Record<string, number> = {}

  if (highLogs.rows){
    for (let i = 0; i < highLogs.rows.length; i++){
      const row : Row = highLogs.rows[i];
      const highestRequestIP = row.HighestRequestsIP as string;
      if (hash[highestRequestIP]){
        hash[highestRequestIP]++
      } else {
        hash[highestRequestIP] = 1;
      }
    }

    console.log("Number of 'high request products' each IP is the highest request on:");
    console.log(hash);
  }

  highLogs.addColumns("MultipleProducts?", (row: Row) => {
    const ip = row.HighestRequestsIP as string;
    let mp = false; 
    if (hash[ip] && hash[ip] > 1){
      mp = true;
    }

    row["MultipleProducts?"] = mp;
    return row;
  }, { inplace: true })


  highLogs.toCSV(absolutePath('./high-logs.csv'))

})

cli.finished()



