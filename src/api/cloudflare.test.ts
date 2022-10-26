import { config } from "https://deno.land/std@0.160.0/dotenv/mod.ts";
const env = await config();

import { Cloudflare } from "./cloudflare.ts";
import { Datetime } from "../helpers/datetime.ts";
import { CSV } from "../helpers/csv.ts";
import { task } from "../helpers/cli.ts";

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
let fields = [
    "ClientIP",
    "ClientASN",
    "ClientCountry",
    "ClientDeviceType",
    "ClientIP",
    "ClientIPClass",
    "ClientRequestMethod",
    "ClientRequestPath",
    "ClientRequestURI",
    "ClientRequestUserAgent",
    "EdgePathingSrc",
    "EdgePathingStatus",
];

await task("Get Cloudflare logs from the past day", async () => {
    logs = await cf.logs(start, end, fields);
});

const csv: CSV = new CSV();
let products: CSV = new CSV();

await task("Create csv from Cloudflare logs and filter by products", () => {
    csv.create({ headers: fields, rows: logs.data });
    products = csv.filter((row) => {
        if (typeof row.ClientRequestPath === "string") {
            return row.ClientRequestPath.includes("product");
        }

        return false;
    });
});

// console.log(products);
