export class Datetime {
    private date: Date;
    constructor(params?: DatetimeParams) {
        if (params) {
            const { year, month, day, hour, minute, second } = params;

            const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (month < 1 || month > 12) {
                throw new Error(
                    "month must be greater than 0 and less than 13"
                );
            }

            if (day < 1) {
                throw new Error("day must be greater than 0");
            }

            if (day > monthDays[month - 1]) {
                throw new Error("day incompatible with month");
            }

            this.date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            this.date = new Date();
        }
    }

    public getDate = () => this.date;

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

    static difference = (start: Date, end: Date): number =>
        end.valueOf() - start.valueOf();

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
