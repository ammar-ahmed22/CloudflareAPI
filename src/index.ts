import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import * as path from "path";
import { csvToJSON } from "./helpers/csv";
import { readJSON } from "./helpers/file";
import { Cloudflare } from "./api/cloudflare";
import { Datetime } from "./helpers/datetime";
import colors from "colors/safe";

// ==== Reading CSV and writing to JSON ====
const csvPath = path.resolve(__dirname, "./test-data/jun6data.csv");
const exportPath = path.resolve(__dirname, "./test-data/jun6data.json");
const headers: string[] = [
    "ourCustomSKU",
    "marketprice",
    "marketavail",
    "our_item_name",
    "updated_at_est_time",
    "published_at",
    "tags",
];

csvToJSON({
    csvPath,
    exportPath,
    headers,
    cast: (columnValue, ctx) => {
        if (ctx.column === "marketprice") {
            return parseFloat(columnValue);
        }

        if (ctx.column === "marketavail") {
            return columnValue === "Yes";
        }

        return columnValue;
    },
});

// ==== Reading JSON ====
const data = readJSON(path.resolve(__dirname, "./test-data/jun6data.json"));

// ==== Cloudflare API ====
// api requires at least 5 minutes in past
const end = Datetime.createDate(new Date(), "past", { minutes: 10 });
const start = Datetime.createDate(end, "past", { days: 1 });

const cf = new Cloudflare({
    baseURL: `${process.env.CF_API_BASE_URL}`,
    headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": `${process.env.CF_AUTH_EMAIL}`,
        "X-Auth-Key": `${process.env.CF_API_KEY}`,
    },
});

const getLogs = async () => {
    const s = performance.now();
    const logs = await cf.logs(start, end, [
        "ClientIP",
        "RayID",
        "EdgeStartTimestamp",
    ]);

    const dateOpts : Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }

    const startString = logs.start.toLocaleString('en-US', dateOpts)
    const endString = logs.end.toLocaleString("en-US", dateOpts);
    const timeElapsed = Math.floor((performance.now() - s) / 1000);

    console.log(
        `Retrieved logs from ${colors.cyan(
            startString
        )} to ${colors.cyan(endString)} in ${colors.cyan(timeElapsed + "s")} with ${colors.cyan(logs.data.length.toString())} entries.`
    );
};

getLogs();
