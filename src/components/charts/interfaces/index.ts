/** One line on the trend chart. */
export interface TrendSeries {
  id: string;
  /** Any CSS colour. Series are periods, not verdicts, so avoid the severity
   *  palette here — a line is not good or bad, the comparison is. */
  color: string;
  /** One entry per label. `null` breaks the line rather than dropping it to
   *  the floor, which is the honest rendering of "no figure for this point". */
  points: (number | null)[];
  /** Draws the line dashed. Two series distinguished only by shade become
   *  indistinguishable exactly where they cross, which is the moment worth
   *  reading — dash carries the difference where colour alone fails. */
  dashed?: boolean;
}
