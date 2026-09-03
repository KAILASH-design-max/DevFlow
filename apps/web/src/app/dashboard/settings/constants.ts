export const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada) - UTC-5" },
  { value: "America/Chicago", label: "Central Time (US & Canada) - UTC-6" },
  { value: "America/Denver", label: "Mountain Time (US & Canada) - UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada) - UTC-8" },
  { value: "Europe/London", label: "London, Dublin, Edinburgh - UTC+0" },
  { value: "Europe/Berlin", label: "Amsterdam, Berlin, Rome, Paris - UTC+1" },
  { value: "Asia/Kolkata", label: "Mumbai, New Delhi, Bangalore - UTC+5:30" },
  { value: "Asia/Tokyo", label: "Tokyo, Seoul, Osaka - UTC+9" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne, Brisbane - UTC+10" },
];

export const AVATAR_GRADIENTS = [
  { id: "from-indigo-600 to-blue-500", label: "Indigo & Blue" },
  { id: "from-purple-600 to-pink-500", label: "Purple & Pink" },
  { id: "from-emerald-600 to-teal-500", label: "Emerald & Teal" },
  { id: "from-amber-500 to-orange-500", label: "Amber & Orange" },
  { id: "from-rose-600 to-red-500", label: "Rose & Crimson" },
  { id: "from-cyan-600 to-blue-600", label: "Cyan & Ocean" },
];

export const DATE_FORMAT_OPTIONS = [
  { id: "MMM D, YYYY", label: "Aug 20, 2026", description: "Standard (Month Day, Year)" },
  { id: "YYYY-MM-DD", label: "2026-08-20", description: "ISO 8601 (Year-Month-Day)" },
  { id: "MM/DD/YYYY", label: "08/20/2026", description: "US Format (Month/Day/Year)" },
  { id: "DD/MM/YYYY", label: "20/08/2026", description: "European Format (Day/Month/Year)" },
];

export { RBAC_ROLE_PERMISSIONS_MATRIX, ROLES } from "@devflow/shared";
