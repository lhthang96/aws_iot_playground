export const getTimestamp = (timestamp?: string | number | Date): string => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toTimeString().split(' ')[0];
};
