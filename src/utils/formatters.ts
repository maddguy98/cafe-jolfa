// Convert English digits to Persian digits
export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// Format price in Iranian Tomans with thousands separator and Persian digits
export function formatPrice(price: number): string {
  const formatted = price.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

// Compact short price (e.g. 85,000 -> ۸۵ T)
export function formatShortPrice(price: number): string {
  const thousands = Math.round(price / 1000);
  return `${toPersianDigits(thousands)} T`;
}
