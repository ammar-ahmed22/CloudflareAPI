import * as fs from "fs";
import { parse } from "csv-parse";
import type { CastingContext } from "csv-parse";

export const csvToJSON = ({
    csvPath,
    exportPath,
    headers,
    cast,
}: csvToJSONOpts) => {
    const file = fs.readFileSync(csvPath, { encoding: "utf-8" });

    parse(
        file,
        {
            delimiter: ",",
            columns: headers,
            fromLine: cast ? 2 : undefined,
            cast,
        },
        (error, result) => {
            if (error) {
                console.error(error);
            }

            //console.log("Result:", result);
            fs.writeFileSync(exportPath, JSON.stringify(result, null, 2));
        }
    );
};
