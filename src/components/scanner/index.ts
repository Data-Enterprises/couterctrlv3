// numSystem: string = "0"
const upceToUpca = (upceCore: string): string => {
  upceCore = upceCore.trim();

  const [m1, m2, m3, p1, p2, r] = upceCore;

  let upcaBody: string;

  if (r === "0" || r === "1" || r === "2") {
    upcaBody = `${m1}${m2}${r}0000${m3}${p1}${p2}`;
  } else if (r === "3") {
    upcaBody = `${m1}${m2}${m3}00000${p1}${p2}`;
  } else if (r === "4") {
    upcaBody = `${m1}${m2}${m3}${p1}00000${p2}`;
  } else {
    upcaBody = `${m1}${m2}${m3}${p1}${p2}0000${r}`;
  }

  return upcaBody;
};

export const normalizeUpc = (upc: string): string => {
  // Normalize UPC formats to a single consistent format

  if (upc.length === 13) {
    upc = upc.slice(2, -1);
  } else if (upc.length === 12) {
    // upc = upc.slice(1, -1);
    // Take the last digitoff
    upc = upc.slice(0, -1);
  } else if (upc.length === 8) {
    upc = upc.slice(1, -1);
    upc = upceToUpca(upc);
  }

  return upc;
};
