/**
 * Convert decimal hours to HH:MM string.
 * e.g. 1.5 → "01:30", 8 → "08:00", 0.25 → "00:15"
 */
export function hoursToHHMM(decimal) {
  if (decimal == null || isNaN(decimal)) return '';
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Convert HH:MM string to decimal hours.
 * e.g. "01:30" → 1.5, "08:00" → 8, "00:15" → 0.25
 * Returns null if the input is incomplete or invalid.
 */
export function hhmmToHours(hhmm) {
  if (!hhmm || hhmm.length < 5) return null;
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;
  if (m < 0 || m > 59) return null;
  return h + m / 60;
}

/**
 * Format a raw mask value (digits only) into HH:MM display.
 * e.g. "" → "", "0" → "0", "08" → "08:", "083" → "08:3", "0830" → "08:30"
 */
export function formatTimeMask(digits) {
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

/**
 * Extract raw digits from a masked value.
 */
export function extractDigits(masked) {
  return masked.replace(/\D/g, '').slice(0, 4);
}
