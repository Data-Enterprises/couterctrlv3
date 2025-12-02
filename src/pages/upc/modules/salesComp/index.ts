export interface WeekDay {
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
  Sunday: number;
}

export interface CardData {
  week: string;
  sales: WeekDay;
}
