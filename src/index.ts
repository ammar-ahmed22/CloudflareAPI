import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import * as path from "path";
import { csvToJSON } from "./helpers/csv";
import { readJSON } from "./helpers/file";

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

const data = readJSON(path.resolve(__dirname, "./test-data/jun6data.json"));


