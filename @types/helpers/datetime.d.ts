export interface DatetimeParams{
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number,
  second?: number
}

export type Elapsed = {
  years?: number,
  days?: number,
  hours?: number,
  minutes?: number,
  seconds?: number
}