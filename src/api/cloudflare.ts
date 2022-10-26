import { config } from "https://deno.land/std@0.160.0/dotenv/mod.ts";
const env = await config();
// import axios from "axios";
// import type { AxiosInstance, AxiosError } from "axios";
import { Datetime } from "../helpers/datetime.ts";

export class Cloudflare {
    // public axios: AxiosInstance;
    public baseURL: string;
    public headers: Record<string, string>;
    public url: URL;
    constructor({ baseURL, headers }: CloudflareParams) {
        // this.axios = axios.create({ baseURL, headers });
        this.baseURL = baseURL;
        this.headers = headers;
        this.url = new URL(this.baseURL);
    }

    private createURLWithSearchParams = (
        base: URL,
        params: Record<string, any>
    ): URL => {
        const url = new URL("", base);
        Object.keys(params).forEach((key) => {
            url.searchParams.set(key, `${params[key]}`);
        });

        return url;
    };

    private createURLFromEndpoint = (endpoint: string): URL => {
        if (endpoint[0] !== "/") {
            const error = new Error("string endpoint must start with '/'");
            throw error.message;
        }

        return new URL(this.url.pathname + endpoint, this.url.origin);
    };

    public get = async (endpoint: string | URL) => {
        if (typeof endpoint === "string" && endpoint[0] !== "/") {
            const error = new Error("string endpoint must start with '/'");
            throw error.message;
        }
        try {
            const fetchURL: URL =
                typeof endpoint === "string"
                    ? this.createURLFromEndpoint(endpoint)
                    : endpoint;
            const res = await fetch(fetchURL.href, {
                method: "GET",
                headers: this.headers,
            });

            // const text = await res.text();
            // console.log({ json });
            return res;
        } catch (error: any) {
            console.error(error.response);
        }
    };

    private parseLogData = (data: string) => {
        const res: Row[] = [];
        data.split("\n")
            .filter((doc) => doc)
            .forEach((doc: string) => {
                res.push(JSON.parse(doc));
            });
        return res;
    };

    public logs = async (
        start: Date,
        end: Date,
        fields: string[]
    ): Promise<CloudflareLogs> => {
        const baseURL = this.createURLFromEndpoint(
            `/zones/${env.CF_ZONE_ID}/logs/received`
        );

        const oneHour = 60 * 60;
        const range = Datetime.DateRange(start, end, oneHour);

        if (range.length > 2) {
            // console.log("more than an 1h59m");
            let res: Row[] = [];
            for (let i = 0; i < range.length - 1; i++) {
                const logsURL = this.createURLWithSearchParams(baseURL, {
                    start: Math.floor(range[i].valueOf() / 1000),
                    end: Math.floor(range[i + 1].valueOf() / 1000),
                    fields: fields.join(","),
                    timestamps: "unixnano",
                });

                const data: string = (await (
                    await this.get(logsURL)
                )?.text()) as string;
                res = res.concat(this.parseLogData(data));
            }

            return {
                start: range[0],
                end: range[range.length - 1],
                data: res,
            };
        } else {
            end = range.length > 1 ? range[1] : end;
            start = range[0];
            const logsURL = this.createURLWithSearchParams(baseURL, {
                start: Math.floor(start.valueOf() / 1000),
                end: Math.floor(end.valueOf() / 1000),
                fields: fields.join(","),
                timestamps: "unixnano",
            });

            const data: string = (await (
                await this.get(logsURL)
            )?.text()) as string;

            return {
                start,
                end,
                data: this.parseLogData(data),
            };
        }
    };
}
