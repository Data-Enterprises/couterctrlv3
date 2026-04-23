export const chunkData = (data: any[]) => {
  const chunks: any[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    chunks.push(data.slice(i, i + 7));
  }
  return chunks;
};

export const changeTextColor = (num1: number, num2: number) => {
  if (num1 > num2) return "text-emerald-500";
  if (num1 < num2) return "text-orange-500";
  return "text-content";
};

export const formatDate = (dateStr: string) => {
  const split = dateStr.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};
