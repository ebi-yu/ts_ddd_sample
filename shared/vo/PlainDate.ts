export class PlainDate {
  public readonly _year: number;
  public readonly _month: number;
  public readonly _day: number;

  constructor() {
    const [year, month, day] = new Date()
      .toISOString()
      .split("T")[0]
      .split("-");
    this._year = Number(year);
    this._month = Number(month);
    this._day = Number(day);
  }

  get value(): string {
    return `${this._year}-${String(this._month).padStart(2, "0")}-${String(
      this.day
    ).padStart(2, "0")}`;
  }

  get year(): number {
    return this._year;
  }

  get month(): number {
    return this._month;
  }

  get day(): number {
    return this._day;
  }

  equals(other: PlainDate): boolean {
    return (
      this._year === other._year &&
      this._month === other._month &&
      this._day === other._day
    );
  }
}
