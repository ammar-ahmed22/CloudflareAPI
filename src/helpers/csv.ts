// // @deno-types="./csv.d.ts"
// // @deno-types="./string.d.ts";
// import "./string.ts";
// import type { csvValue, Row, ICSV, CSVFromFileOpts, CSVFilterOpts } from "./csv.d.ts"

export class CSV implements ICSV {
    public headers: string[] | undefined;
    public rows: Row[] | undefined;

    public fromFile = async (path: string, opts?: CSVFromFileOpts) => {
        const csv = await readCSV(path, opts);
        this.headers = csv.headers;
        this.rows = csv.rows;

        return this;
    };

    public create = ({ headers, rows }: ICSV) => {
        this.headers = headers;
        this.rows = rows;

        return this;
    };

    public size = (): number => {
        if (this.rows) return this.rows.length;
        return 0;
    };

    // Writes to csv file
    public toCSV = async (path: string) => {
        if (!this.headers || !this.rows) {
            throw new Error(
                "the init() or create() methods must be called prior to using this method."
            );
        }

        let fileString = this.headers.join(",") + "\n";

        for (let i = 0; i < this.rows.length; i++) {
            let rowString = "";
            const rowObj = this.rows[i];
            Object.keys(rowObj).forEach((key, idx, arr) => {
                rowString += `${rowObj[key]}${
                    idx !== arr.length - 1 ? "," : "\n"
                }`;
            });

            fileString += rowString;
        }

        await Deno.writeTextFile(path, fileString);
    };

    public getRowFromValue = (colName: string, value: csvValue): Row | null => {
        if (!this.headers || !this.rows) {
            throw new Error(
                "the init() or create() methods must be called prior to using this method."
            );
        }

        if (!this.headers.includes(colName)) {
            throw new Error(`column: ${colName} does not exist on CSV.`);
        }

        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            if (row[colName] === value) {
                return row;
            }
        }

        return null;
    };

    public addColumn = (newColumn: string, cb: (row: Row) => Row): CSV => {
        if (!this.headers || !this.rows) {
            throw new Error(
                "the init() or create() methods must be called prior to using this method."
            );
        }

        const newHeaders = [...this.headers];
        const newRows: Row[] = [];
        for (let i = 0; i < this.rows.length; i++) {
            const newRow = cb(this.rows[i]);
            if (!Object.keys(newRow).includes(newColumn)) {
                const error = new Error(
                    `callback must return row with new column: "${newColumn}" added.`
                );
                throw error.message;
            }
        }

        return new CSV().create({ headers: newHeaders, rows: newRows });
    };

    public filter = (cb: (row: Row) => boolean, opts?: CSVFilterOpts): CSV => {
        if (!this.headers || !this.rows) {
            throw new Error(
                "the init() or create() methods must be called prior to using this method."
            );
        }

        const headers = [...this.headers];
        const rows: Row[] = [];

        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            if (cb(row)) {
                rows.push(row);
            }
        }

        if (opts?.inplace) {
            this.headers = headers;
            this.rows = rows;
        }

        return opts?.inplace ? this : new CSV().create({ headers, rows });
    };
}

export const readCSV = async (
    path: string,
    opts?: CSVFromFileOpts
): Promise<ICSV> => {
    const text = await Deno.readTextFile(path);
    const rows = text
        .filter((char) => char !== "\r")
        .split("\n")
        .filter((row) => row);

    const delimiter = opts?.delimiter ? opts.delimiter : ",";
    let headers: string[] = [];

    const res: Row[] = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].split(delimiter);

        const omitIndices: number[] = [];

        if (i === 0) {
            headers = cells
                .filter((header, idx) => {
                    if (!opts?.omitColumns) {
                        return true;
                    }

                    if (opts.omitColumns.includes(header)) {
                        omitIndices.push(idx);
                        return false;
                    }

                    return true;
                })
                .map((header) => {
                    if (opts?.castHeader) {
                        return opts.castHeader(header);
                    }

                    return header;
                });
        }

        const row: Row = {};

        for (let j = 0; j < headers.length; j++) {
            if (omitIndices.includes(j)) {
                continue;
            }

            row[headers[j]] = opts?.castValue
                ? opts.castValue(cells[j], headers[j])
                : cells[j];
        }

        if (i !== 0) {
            res.push(row);
        }
    }

    return {
        rows: res,
        headers,
    };
};
