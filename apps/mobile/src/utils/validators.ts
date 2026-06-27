// ── Phone Validation (Uganda) ──────────────────────────────
export function isValidUgandaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^\+?256[0-9]{9}$/.test(cleaned) || /^0[0-9]{9}$/.test(cleaned);
}

export function formatUgandaPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+256' + cleaned.slice(1);
  }
  return cleaned;
}

// ── Email Validation ─────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── Password Validation ──────────────────────────────────────
export function isStrongPassword(password: string): boolean {
  return password.length >= 6;
}

// ── Name Validation ──────────────────────────────────────────
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}