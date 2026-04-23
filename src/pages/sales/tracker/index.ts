export const chunkData = (data: any[]) => {
  const chunks: any[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    chunks.push(data.slice(i, i + 7));
  }
  return chunks;
};
