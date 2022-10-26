import * as path from "https://deno.land/std@0.160.0/path/mod.ts";
import { CSV } from "./csv.ts";
import { task } from "./cli.ts";
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts"
import "../../@types/index.d.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const data = new CSV();
Deno.test("CSV", async (t) => {
    const data = new CSV();
    
    await t.step("Read .csv file, omit column and cast values", async () => {
        await data.fromFile(
            path.resolve(__dirname, "../test-data/test-data.csv"),
            {
                omitColumns: ["tags"],
                castValue: (val: string, colName: string) : csvValue => {
                    if (colName === "competitor_price"){
                        return parseFloat(val);
                    }

                    if (colName === "updated_at_est_time"){
                        return new Date(val)
                    }

                    return val;
                },
            }
        )

        assertEquals(data.headers?.includes("tags"), false)
    })

    await t.step("Checking if size of CSV is correct", () => assertEquals(data.size(), 4992))

    await t.step("Writing updated csv to file", async () => {
       await data.toCSV(path.resolve(__dirname, "../test-data/test.csv"))
       
       try {
        const f = await Deno.open(path.resolve(__dirname, "../test-data/test.csv"))
        f.close()
       } catch (error) {
        if (error instanceof Deno.errors.NotFound){
            throw "file does not exist"
        }
       }

       
    })

    await t.step("Getting row from value", () => {
        const row = data.getRowFromValue("ourCustomSKU", "ETATLIBSOMEONEM-100B");
        assertNotEquals(row, null);
    })

    await t.step("Adding column", () => {
        const withTax = data.addColumn("withTax", (row: Row) => {
            let taxPrice : number = 0;
            if (typeof row.competitor_price === "number"){
                taxPrice = parseFloat((row.competitor_price * 1.13).toFixed(2));
            }

            row.withTax = taxPrice;
            return row;
        })

        assertEquals(withTax.headers?.includes("withTax"), true);
        assertEquals(withTax.size(), 4992)
    })

    await t.step("Filtering CSV", () => {
        const over100 = data.filter((row: Row) => {

            if (typeof row.competitor_price === "number"){
                if (row.competitor_price < 100){
                    return false;
                }
            }

            return true
        })

        assertEquals(over100.size(), 1449);
    })

    await t.step("Filtering CSV inplace", () => {
        data.filter((row: Row) => {

            if (typeof row.competitor_price === "number"){
                if (row.competitor_price < 100){
                    return false;
                }
            }

            return true
        }, {
            inplace: true
        })

        assertEquals(data.size(), 1449);
    })

})

