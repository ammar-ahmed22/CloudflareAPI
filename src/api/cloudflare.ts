import { config } from "https://deno.land/std@0.160.0/dotenv/mod.ts";
const env = await config();
import { Datetime } from "../helpers/datetime.ts";
import type { CloudflareParams, CloudflareLogs } from "../../@types/api/cloudflare.d.ts";

/**
 * Cloudflare API helper
 * @date 2022-10-26 - 12:01:28 p.m.
 *
 * @export
 * @class Cloudflare
 * @typedef {Cloudflare}
 */
export class Cloudflare {

    public baseURL: string;
    public headers: Record<string, string>;
    public url: URL;
    /**
     * Creates an instance of Cloudflare.
     * @date 2022-10-26 - 12:01:42 p.m.
     *
     * @constructor
     * @param {CloudflareParams} { baseURL, headers }
     */
    constructor({ baseURL, headers }: CloudflareParams) {
        // this.axios = axios.create({ baseURL, headers });
        this.baseURL = baseURL;
        this.headers = headers;
        this.url = new URL(this.baseURL);
    }

    /**
     * Generates new URL with from a URL with provided search params
     * @date 2022-10-26 - 12:01:51 p.m.
     *
     * @param {URL} base - URL to add search params to
     * @param {Record<string, any>} params - Object with search params to add
     * @returns {URL}
     */
    private createURLWithSearchParams = (
        base: URL,
        // deno-lint-ignore no-explicit-any
        params: Record<string, any>
    ): URL => {
        const url = new URL("", base);
        Object.keys(params).forEach((key) => {
            url.searchParams.set(key, `${params[key]}`);
        });

        return url;
    };

    /**
     * Generates a new URL from a Cloudflare baseURL with endpoint added 
     * @date 2022-10-26 - 12:02:38 p.m.
     *
     * @param {string} endpoint - Endpoint to add
     * @returns {URL}
     */
    private createURLFromEndpoint = (endpoint: string): URL => {
        if (endpoint[0] !== "/") {
            const error = new Error("string endpoint must start with '/'");
            throw error.message;
        }

        return new URL(this.url.pathname + endpoint, this.url.origin);
    };

    /**
     * HTTP get request with provided endpoint from baseURL
     * @date 2022-10-26 - 12:04:13 p.m.
     *
     * @async
     * @param {(string | URL)} endpoint
     * @returns {Promise<Response | undefined>}
     */
    public get = async (endpoint: string | URL) : Promise<Response | undefined> => {
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

            return res;
        } catch (error: unknown) {
            console.error(error);
        }
    };

    /**
     * Parses Cloudflare Logs response into array of Row
     * @date 2022-10-26 - 12:12:14 p.m.
     *
     * @param {string} data - Cloudflare logs response converted to text
     * @returns {Row[]}
     */
    private parseLogData = (data: string) : Row[] => {
        const res: Row[] = [];
        data.split("\n")
            .filter((doc) => doc)
            .forEach((doc: string) => {
                res.push(JSON.parse(doc));
            });
        return res;
    };

    /**
     * Gets Cloudflares logs from start to end date (max 7 days)
     * @date 2022-10-26 - 12:13:02 p.m.
     *
     * @async
     * @param {Date} start - Start date to get logs from 
     * @param {Date} end - End date to get logs from (must be closer to now than start)
     * @param {string[]} fields
     * @returns {Promise<CloudflareLogs>}
     */
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
