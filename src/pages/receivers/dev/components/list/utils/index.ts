const fmtRangePart = (mdy: string, withYear = false) => {
  const [m, d, y] = mdy.split("/");
  return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
};

export const fmtDateLabel = (start: string, end: string): string =>
  `${fmtRangePart(start)} – ${fmtRangePart(end, true)}`;
