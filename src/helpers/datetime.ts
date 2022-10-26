import type { DatetimeParams, Elapsed } from "../../@types/helpers/datetime.d.ts"

/**
 * Custom Datetime helper class
 * @date 2022-10-26 - 11:55:42 a.m.
 *
 * @export
 * @class Datetime
 * @typedef {Datetime}
 */
export class Datetime {
    private date: Date;
    /**
     * Creates an instance of Datetime.
     * @date 2022-10-26 - 11:56:01 a.m.
     *
     * @constructor
     * @param {?DatetimeParams} [params] - Optional object to construct date with.
     */
    constructor(params?: DatetimeParams) {
        if (params) {
            const { year, month, day, hour, minute, second } = params;

            const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (month < 1 || month > 12) {
                const error = new Error(
                    "month must be greater than 0 and less than 13"
                );
                throw error.message;
            }

            if (day < 1) {
                const error = new Error("day must be greater than 0");
                throw error.message;
            }

            if (day > monthDays[month - 1]) {
                const error = new Error("day incompatible with month");
                throw error.message;
            }

            this.date = new Date(year, month - 1, day, hour ? hour : 0, minute ? minute : 0, second ? second : 0);
        } else {
            this.date = new Date();
        }
    }

    /**
     * Gets the JavaScript date object
     * @date 2022-10-26 - 11:58:24 a.m.
     *
     * @returns {Date}
     */
    public getDate = () => this.date;

    /**
     * Creates a date in the future or past from a JavaScript date
     * @date 2022-10-26 - 11:58:43 a.m.
     *
     * @param {Date} date - Date to add or subtract time from
     * @param {("past" | "future")} to - New date is in the future or past
     * @param {Elapsed} elapsed - Time elapsed to or from date
     * @returns {*}
     */
    static createDate = (
        date: Date,
        to: "past" | "future",
        elapsed: Elapsed
    ) => {
        let elapsedMS = 0;

        if (elapsed?.years) {
            elapsedMS += elapsed.years * 365 * 24 * 60 * 60 * 1000;
        }

        if (elapsed?.days) {
            elapsedMS += elapsed.days * 24 * 60 * 60 * 1000;
        }

        if (elapsed?.hours) {
            elapsedMS += elapsed.hours * 60 * 60 * 1000;
        }

        if (elapsed?.minutes) {
            elapsedMS += elapsed.minutes * 60 * 1000;
        }

        if (elapsed?.seconds) {
            elapsedMS += elapsed.seconds * 1000;
        }

        const m = to === "past" ? -1 : 1;

        const newDate = new Date(date);

        newDate.setMilliseconds(newDate.getMilliseconds() + elapsedMS * m);

        return newDate;
    };

    /**
     * Difference in ms between two JavaScript date objects
     * @date 2022-10-26 - 11:59:56 a.m.
     *
     * @param {Date} start
     * @param {Date} end
     * @returns {number}
     */
    static difference = (start: Date, end: Date): number =>
        end.valueOf() - start.valueOf();

    /**
     * Creates a range of equally spaced dates
     * @date 2022-10-26 - 12:00:19 p.m.
     *
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @param {number} intervalSecs - Time in seconds between each date
     * @returns {Date[]}
     */
    static DateRange = (
        start: Date,
        end: Date,
        intervalSecs: number
    ): Date[] => {
        let curr: Date = start;
        const res: Date[] = [curr];

        while (this.difference(curr, end) >= 0) {
            const next = Datetime.createDate(curr, "future", {
                seconds: intervalSecs,
            });
            res.push(next);
            curr = next;
        }

        return res.filter((date) => this.difference(date, end) >= 0);
    };
}
