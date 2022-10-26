import type { csvValue, Row, ICSV, CSVFromFileOpts, CSVFilterOpts } from "../../@types/index.d.ts"
import "./string.ts";

/**
 * CSV Object class
 * @date 2022-10-26 - 4:31:25 a.m.
 *
 * @export
 * @class CSV
 * @typedef {CSV}
 * @implements {ICSV}
 */
export class CSV implements ICSV {
    public headers: string[] | undefined;
    public rows: Row[] | undefined;

    /**
     * Initializes the CSV from a file
     * @date 2022-10-26 - 4:32:03 a.m.
     *
     * @async
     * @param {string} path - Absolute path to the file
     * @param {?CSVFromFileOpts} [opts] - Options for generating the CSV
     * @returns {CSV}
     */
    public fromFile = async (path: string, opts?: CSVFromFileOpts) => {
        const csv = await readCSV(path, opts);
        this.headers = csv.headers;
        this.rows = csv.rows;

        return this;
    };

    /**
     * Initializes the CSV from provided headers and rows arrays
     * @date 2022-10-26 - 4:33:28 a.m.
     *
     * @param {ICSV} { headers, rows } - headers and rows to generate CSV from
     * @returns {CSV}
     */
    public create = ({ headers, rows }: ICSV) => {
        this.headers = headers;
        this.rows = rows;

        return this;
    };

    /**
     * Returns the number of rows in the CSV (excluding headers)
     * @date 2022-10-26 - 4:34:35 a.m.
     *
     * @returns {number}
     */
    public size = (): number => {
        if (this.rows) return this.rows.length;
        return 0;
    };

    
    /**
     * Generates a .csv file from the CSV
     * @date 2022-10-26 - 4:35:16 a.m.
     *
     * @async
     * @param {string} path - Absolute path to the file to write to
     * @returns {Promise<void>}
     */
    public toCSV = async (path: string) => {
        if (!this.headers || !this.rows) {
            throw new Error(
                "the fromFile() or create() methods must be called prior to using this method."
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

    /**
     * Gets a row object given column and value 
     * @date 2022-10-26 - 4:36:27 a.m.
     *
     * @param {string} colName - Name of the column to check
     * @param {csvValue} value - Value of the column at the row needed
     * @returns {(Row | null)}
     */
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

    /**
     * Adds a column to all rows using a callback and creates a new CSV
     * @date 2022-10-26 - 4:37:34 a.m.
     *
     * @param {string} newColumn - Name of the column to add
     * @param {(row: Row) => Row} cb - Callback function in which each new column must be added to each row
     * @returns {CSV}
     */
    public addColumn = (newColumn: string, cb: (row: Row) => Row): CSV => {
        if (!this.headers || !this.rows) {
            throw new Error(
                "the init() or create() methods must be called prior to using this method."
            );
        }

        const newHeaders = [...this.headers, newColumn];
        const newRows: Row[] = [];
        for (let i = 0; i < this.rows.length; i++) {
            const newRow = cb(this.rows[i]);
            if (!Object.keys(newRow).includes(newColumn)) {
                const error = new Error(
                    `callback must return row with new column: "${newColumn}" added.`
                );
                throw error.message;
            }
            newRows.push(newRow)
        }

        return new CSV().create({ headers: newHeaders, rows: newRows });
    };

    /**
     * Filters CSV and generates new CSV using callback, can also mutate the current CSV
     * @date 2022-10-26 - 4:39:19 a.m.
     *
     * @param {(row: Row) => boolean} cb - Callback which must return boolean value to keep or remove column
     * @param {?CSVFilterOpts} [opts] - Options for filtering (inplace = true, will mutate)
     * @returns {CSV}
     */
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

/**
 * Reads a .csv file and return headers and rows
 * @date 2022-10-26 - 4:41:16 a.m.
 *
 * @async
 * @param {string} path - Absolute path to the file
 * @param {?CSVFromFileOpts} [opts] - Options for reading the csv 
 * @returns {Promise<ICSV>}
 */
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
