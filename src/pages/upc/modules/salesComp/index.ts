export interface WeekDay {
  Monday: number | null;
  Tuesday: number | null;
  Wednesday: number | null;
  Thursday: number | null;
  Friday: number | null;
  Saturday: number | null;
  Sunday: number | null;
}

export interface CardData {
  week: string;
  sales: WeekDay;
}
