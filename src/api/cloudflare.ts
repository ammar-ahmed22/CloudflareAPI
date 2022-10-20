import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import { Datetime } from "../helpers/datetime";

export class Cloudflare {
    public axios: AxiosInstance;
    constructor({ baseURL, headers }: CloudflareParams) {
        this.axios = axios.create({ baseURL, headers });
    }

    private addSearchParams = (
        url: string,
        params: Record<string, any>
    ): string => {
        url += "?";
        Object.keys(params).forEach((param, idx) => {
            const len = Object.keys(params).length;
            url += `${param}=${params[param]}`;
            if (idx !== len - 1) {
                url += "&";
            }
        });
        return url;
    };

    public get = async (endpoint: string) => {
        try {
            const res = await this.axios.get(endpoint);
            return res.data;
        } catch (error: any) {
            console.error(error.response);
        }
    };

    private parseLogData = (data: string) => {
        const res: object[] = [];
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
        const baseEndpoint = `zones/${process.env.CF_ZONE_ID}/logs/received`;

        const oneHour = 60 * 60;
        const range = Datetime.DateRange(start, end, oneHour);

        if (range.length > 2) {
            console.log("more than an 1h59m");
            let res: object[] = [];
            for (let i = 0; i < range.length - 1; i++) {
                const logsEndpoint = this.addSearchParams(baseEndpoint, {
                    start: Math.floor(range[i].valueOf() / 1000),
                    end: Math.floor(range[i + 1].valueOf() / 1000),
                    fields: fields.join(","),
                    timestamps: "unixnano",
                });

                const data: string = await this.get(logsEndpoint);
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
            const logsEndpoint = this.addSearchParams(baseEndpoint, {
                start: Math.floor(start.valueOf() / 1000),
                end: Math.floor(end.valueOf() / 1000),
                fields: fields.join(","),
                timestamps: "unixnano",
            });

            const data: string = await this.get(logsEndpoint);

            return {
                start,
                end,
                data: this.parseLogData(data),
            };
        }
    };
}
