/**
 * Format large numbers with K/M/B suffixes
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "2.44M", "1.52B")
 */
export function formatLargeNumber(num: number, decimals: number = 2): string {
  if (num === 0) return '0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000_000) {
    return sign + (absNum / 1_000_000_000).toFixed(decimals) + 'B';
  }

  if (absNum >= 1_000_000) {
    return sign + (absNum / 1_000_000).toFixed(decimals) + 'M';
  }

  if (absNum >= 1_000) {
    return sign + (absNum / 1_000).toFixed(decimals) + 'K';
  }

  return sign + Math.round(absNum).toString();
}
