export const isValidMockKey = (key: string) => {
  const validRegex = /^[a-z0-9\-]+$/i;
  return validRegex.test(key);
};
