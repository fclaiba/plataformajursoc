export const now = () => Date.now();

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const pairHash = (left: string, right: string) =>
  [left, right].sort().join("__");
