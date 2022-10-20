import * as fs from "fs";

export const readJSON = (filePath: string) => {
    if (filePath.split(".")[1] !== "json") {
        throw new Error("path must point to json");
    }
    return JSON.parse(fs.readFileSync(filePath).toString());
};
