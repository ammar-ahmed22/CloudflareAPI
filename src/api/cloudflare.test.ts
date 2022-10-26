import { config } from "https://deno.land/std@0.160.0/dotenv/mod.ts";
const env = await config();

import { Cloudflare } from "./cloudflare.ts";
import type { CloudflareLogs } from "../../@types/api/cloudflare.d.ts"
import { Datetime } from "../helpers/datetime.ts";
import { CSV } from "../helpers/csv.ts";


Deno.test("Cloudflare", async (t) => {
    const cf = new Cloudflare({
        baseURL: `${env.CF_API_BASE_URL}`,
        headers: {
            "Content-Type": "application/json",
            "X-Auth-Email": `${env.CF_AUTH_EMAIL}`,
            "X-Auth-Key": `${env.CF_API_KEY}`,
        },
    });
    
    let logs: CloudflareLogs; 
    const end = Datetime.createDate(new Date(), "past", { minutes: 10 });
    const start = Datetime.createDate(end, "past", { days: 1 });

    const fields = [
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
    

    await t.step("Getting logs from past day", async () => {
        logs = await cf.logs(start, end, fields);
    })

    await t.step("Create csv from logs and filter by products", () => {
        if (logs){
            const csv = new CSV().create({ headers: fields, rows: logs.data });
            const products = csv.filter((row: Row) => {
                if (typeof row.ClientRequestPath === "string"){
                    return row.ClientRequestPath.includes("product");
                }

                return false;
            })

            console.log(products.size());
        }
    })
})

