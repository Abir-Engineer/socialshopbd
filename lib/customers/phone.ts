/** Strip non-digits for phone matching (search). */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
