import { config } from "https://deno.land/std@0.160.0/dotenv/mod.ts";
const env = await config();
import * as path from "https://deno.land/std@0.160.0/path/mod.ts";
import { Cloudflare } from "./api/cloudflare.ts";
import { Datetime } from "./helpers/datetime.ts";
import { CSV } from "./helpers/csv.ts";
import { task } from "./helpers/cli.ts";
import "./helpers/string.ts";


const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const competitor = new CSV();
await task("Read and parse competitor file", async () => {
    await competitor.fromFile(
        path.resolve(__dirname, "./test-data/10212022.csv"),
        {
            omitColumns: ["tags"],
            castValue: (val: string, cn: string) : csvValue => {
                if (cn === "competitor_price") {
                    return parseFloat(val);
                }

                if (cn === "updated_at_est_time") {
                    return new Date(val);
                }

                return val;
            },
        }
    );
});

const ourProducts = new CSV();

await task("Read and parse our products data", async () => {
    await ourProducts.fromFile(
        path.resolve(__dirname, "./test-data/product-2022-10-24.csv"),
        {
            castValue: (value: string, cn: string) : csvValue => {
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
            castHeader: (header: string) : string => {
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
    );
});

await task("Adding our price to competitor CSV", () => {
    competitor.addColumn("OurPrice", (row) => {
        const productRow = ourProducts.getRowFromValue("SKU", row.ourCustomSKU);

        row["OurPrice"] = productRow ? productRow.Price : null;
        return row;
    });
});

await task("Adding price difference to competitor CSV", () => {
    competitor.addColumn("PriceDifference", (row) => {
        const { OurPrice, competitor_price } = row;

        if (
            typeof OurPrice === "number" &&
            typeof competitor_price === "number"
        ) {
            row.PriceDifference = OurPrice - competitor_price;
        } else {
            row.PriceDifference = null;
        }

        return row;
    });
});

let filtered: CSV = new CSV();

await task("Filtering data by price difference", () => {
    filtered = competitor.filter((row) => {
        if (typeof row.PriceDifference === "number") {
            return row.PriceDifference > 0 && row.PriceDifference <= 5;
        }

        return false;
    });
});

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
