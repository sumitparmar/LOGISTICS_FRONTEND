export function orderReference(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '000000';

  const digits = raw.replace(/\D/g, '');
  if (digits) return digits.slice(-6).padStart(6, '0');

  let hash = 0;
  for (const character of raw) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000000;
  }
  return String(hash).padStart(6, '0');
}
