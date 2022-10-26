import { Datetime } from "./datetime.ts";
import { assertEquals } from "https://deno.land/std@0.160.0/testing/asserts.ts";

Deno.test("Datetime helper", async (t) => {
  const d = new Datetime({
    year: 2022,
    month: 10,
    day: 1,
    hour: 10,
    minute: 30,
    second: 10,
  });

  await t.step("Datetime construction", () => {
    assertEquals(d.getDate(), new Date(2022, 9, 1, 10, 30, 10));
  });

  await t.step("Creating date in the past", () => {
    const year = Datetime.createDate(d.getDate(), "past", {
      years: 1,
    });
    const day = Datetime.createDate(d.getDate(), "past", {
      days: 1,
    });
    const hour = Datetime.createDate(d.getDate(), "past", {
      hours: 1,
    });
    const minute = Datetime.createDate(d.getDate(), "past", {
      minutes: 1,
    });
    const second = Datetime.createDate(d.getDate(), "past", {
      seconds: 1,
    });

    assertEquals(year, new Date(2021, 9, 1, 10, 30, 10));
    assertEquals(day, new Date(2022, 8, 30, 10, 30, 10));
    assertEquals(hour, new Date(2022, 9, 1, 9, 30, 10));
    assertEquals(minute, new Date(2022, 9, 1, 10, 29, 10));
    assertEquals(second, new Date(2022, 9, 1, 10, 30, 9));
  });

  await t.step("Creating date in the future", () => {
    const year = Datetime.createDate(d.getDate(), "future", {
      years: 1,
    });
    const day = Datetime.createDate(d.getDate(), "future", {
      days: 1,
    });
    const hour = Datetime.createDate(d.getDate(), "future", {
      hours: 1,
    });
    const minute = Datetime.createDate(d.getDate(), "future", {
      minutes: 1,
    });
    const second = Datetime.createDate(d.getDate(), "future", {
      seconds: 1,
    });

    assertEquals(year, new Date(2023, 9, 1, 10, 30, 10));
    assertEquals(day, new Date(2022, 9, 2, 10, 30, 10));
    assertEquals(hour, new Date(2022, 9, 1, 11, 30, 10));
    assertEquals(minute, new Date(2022, 9, 1, 10, 31, 10));
    assertEquals(second, new Date(2022, 9, 1, 10, 30, 11));
  });

  await t.step("Creating date range", () => {
    const end = new Datetime({
      year: 2022,
      month: 10,
      day: 26,
      hour: 17,
    });
    const start = Datetime.createDate(end.getDate(), "past", {
      days: 1,
    });

    // Creating range with dates every hour from 1 day ago to 5pm on October 26th
    const range = Datetime.DateRange(
      start,
      end.getDate(),
      60 * 60,
    );
    assertEquals(range.length, 25);
  });

  await t.step("Date difference is correct", () => {
    const end = new Date();
    const start = Datetime.createDate(end, "past", {
      seconds: 1,
    });

    assertEquals(Datetime.difference(start, end), 1000);
  });
});
