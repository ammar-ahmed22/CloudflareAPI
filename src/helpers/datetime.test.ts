import { Datetime } from "./datetime.ts";

const d = new Datetime({
    year: 2022,
    month: 10,
    day: 1,
    hour: 10,
    minute: 30,
    second: 10,
});

// test("testing datetime construction", () => {
//     expect(d.getDate()).toStrictEqual(new Date(2022, 9, 1, 10, 30, 10));
// });

// test("testing create date", () => {
//     const year = Datetime.createDate(d.getDate(), "past", { years: 1 });
//     const day = Datetime.createDate(d.getDate(), "past", { days: 1 });
//     const hour = Datetime.createDate(d.getDate(), "past", { hours: 1 });
//     const minute = Datetime.createDate(d.getDate(), "past", { minutes: 1 });
//     const second = Datetime.createDate(d.getDate(), "past", { seconds: 1 });

//     expect(year).toStrictEqual(new Date(2021, 9, 1, 10, 30, 10));
//     expect(day).toStrictEqual(new Date(2022, 8, 30, 10, 30, 10));
//     expect(hour).toStrictEqual(new Date(2022, 9, 1, 9, 30, 10));
//     expect(minute).toStrictEqual(new Date(2022, 9, 1, 10, 29, 10));
//     expect(second).toStrictEqual(new Date(2022, 9, 1, 10, 30, 9));
// });

// test("testing difference", () => {
//     const end = new Date();
//     const start = Datetime.createDate(end, "past", { seconds: 1 });

//     expect(Datetime.difference(start, end)).toBe(1000);
// });

// test("testing date range", () => {
//     const end = new Date();
//     const start = Datetime.createDate(end, "past", { hours: 1, minutes: 59 });

//     const range = Datetime.DateRange(start, end, 60 * 60);

//     expect(range.length).toBe(2);
// });
