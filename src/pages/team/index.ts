export const roles = [
  { value: "1", label: "Single Store" },
  { value: "2", label: "Multi Store" },
  { value: "3", label: "Security" },
  { value: "4", label: "Accounting" },
  { value: "9", label: "Admin" },
];

export const formData = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  user_level: "",
  company: "",
  confirmPassword: "",
  role: "9",
};

export const userLevels = [
  { levelId: 1, levelDescription: "USER" },
  { levelId: 2, levelDescription: "TECH" },
  { levelId: 3, levelDescription: "STORE MANAGER" },
  { levelId: 4, levelDescription: "HELP DESK" },
  { levelId: 5, levelDescription: "HELP DESK MANAGEMENT" },
  { levelId: 6, levelDescription: "POWER USER" },
  { levelId: 7, levelDescription: "OWNER" },
  { levelId: 8, levelDescription: "ADMIN" },
  { levelId: 9, levelDescription: "PROGRAMMER" },
];


export const getUserLevelDescription = (levelId: number) => {
  const level = userLevels.find((lvl) => lvl.levelId === levelId);
  return level ? level.levelDescription : "UNKNOWN";
};