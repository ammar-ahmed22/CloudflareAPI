import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import { Cloudflare } from "./cloudflare";
import { Datetime } from "../helpers/datetime";

const cf = new Cloudflare({
    baseURL: `${process.env.CF_API_BASE_URL}`,
    headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": `${process.env.CF_AUTH_EMAIL}`,
        "X-Auth-Key": `${process.env.CF_API_KEY}`,
    },
});

jest.setTimeout(30 * 1000);

test("test API is working", async () => {
    const data = await cf.get(`zones/${process.env.CF_ZONE_ID}`);

    //console.log(data);
});

test("testing cloudflare api logs function", async () => {
    const end = Datetime.createDate(new Date(), "past", { minutes: 10 });
    const start = Datetime.createDate(end, "past", { days: 1 });

    const startTime = performance.now();
    const logs = await cf.logs(start, end, [
        "ClientIP",
        "RayID",
        "EdgeStartTimestamp",
    ]);
    const endTime = performance.now();

    // about 20s
    console.log({
        elapsedTime: `${Math.floor((endTime - startTime) / 1000)}s`,
        size: logs.data.length,
    });
});
