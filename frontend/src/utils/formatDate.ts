import { format } from "date-fns";

export const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return format(date, "MMM d, yyyy");
};
