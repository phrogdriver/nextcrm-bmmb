/**
 * Normalize a US phone number to E.164 format (+1XXXXXXXXXX).
 * Handles common input formats:
 *   (719) 555-1234 → +17195551234
 *   719-555-1234   → +17195551234
 *   7195551234     → +17195551234
 *   +17195551234   → +17195551234
 *   1-719-555-1234 → +17195551234
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  // Already has country code or international
  if (input.startsWith("+")) {
    return `+${digits}`;
  }

  // Can't normalize — return as-is
  return input;
}
