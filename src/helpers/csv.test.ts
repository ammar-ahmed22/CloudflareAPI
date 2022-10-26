import * as path from "https://deno.land/std@0.160.0/path/mod.ts";
import { readCSV, CSV } from "./csv.ts";
import { task } from "./cli.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const data = new CSV();
await task("Read and parse data file", async () => {
    await data.fromFile(path.resolve(__dirname, "../test-data/10212022.csv"), {
        omitColumns: ["tags"],
        castValue: (val, cn) => {
            if (cn === "competitor_price") {
                return parseFloat(val);
            }

            if (cn === "updated_at_est_time") {
                return new Date(val);
            }

            return val;
        },
    });
});

const products = new CSV();

await task("Read and parse products data", async () => {
    await products.fromFile(
        path.resolve(__dirname, "../test-data/product-2022-10-24.csv"),
        {
            castValue: (value, cn) => {
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
            castHeader: (header) => {
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
    data.addColumn("OurPrice", (row) => {
        const productRow = products.getRowFromValue("SKU", row.ourCustomSKU);

        row["OurPrice"] = productRow ? productRow.Price : null;
        return row;
    });
});

await task("Adding Price Difference to competitor CSV", () => {
    data.addColumn("PriceDifference", (row) => {
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
    filtered = data.filter((row) => {
        if (typeof row.PriceDifference === "number") {
            return row.PriceDifference > 0 && row.PriceDifference <= 5;
        }

        return false;
    });
});

console.log(filtered.size());
