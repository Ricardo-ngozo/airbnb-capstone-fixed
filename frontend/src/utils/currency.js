/**
 * Currency utilities — ZAR (South African Rand)
 */

// Approximate USD → ZAR conversion rate
export const USD_TO_ZAR = 18.5;

/**
 * Convert a USD amount to ZAR, rounded to the nearest R50.
 * @param {number} usd
 * @returns {number}
 */
export function toZAR(usd) {
  if (!usd || usd === 0) return 0;
  return Math.round((Number(usd) * USD_TO_ZAR) / 50) * 50;
}

/**
 * Format a ZAR amount with the R prefix and locale thousands separator.
 * e.g. 2800 → "R 2 800"
 * @param {number} amount
 * @returns {string}
 */
export function zarFmt(amount) {
  if (!amount && amount !== 0) return "R 0";
  return `R ${Number(amount).toLocaleString("en-ZA")}`;
}
