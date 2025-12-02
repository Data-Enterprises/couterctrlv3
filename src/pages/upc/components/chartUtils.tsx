export const customForecastShadowLayer = (props: any) => {
  const lines = props.series.filter((line: any) =>
    line.id.endsWith("- forecast")
  );

  const getLinePoints = (line: any) => {
    const coordinates: { x: number; y: number }[] = [];
    line.data.forEach((point: any) => {
      coordinates.push(point.position);
    });
    return coordinates;
  };

  return (
    <g>
      {lines.map((line: any) => (
        <path
          key={line.id + "- shadow"}
          d={props.lineGenerator(getLinePoints(line))}
          stroke={line.color}
          strokeWidth={10}
          fill="none"
          style={{
            filter: "blur(8px)",
          }}
        />
      ))}
    </g>
  );
};
