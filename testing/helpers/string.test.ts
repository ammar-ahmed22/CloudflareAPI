import "../../src/helpers/string.ts";
import { assertEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts";

Deno.test("String", async (t) => {
  await t.step("string.filter", () => {
    assertEquals("Ammar".filter((char) => char !== "a"), "Ammr");
  });
});
