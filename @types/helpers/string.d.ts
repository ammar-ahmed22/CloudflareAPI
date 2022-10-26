declare interface String {
  filter(cb: (char: string, idx: number) => boolean): string;
}
