/** Formatea un entero de pesos colombianos como "$ 1.234.567" (sin decimales). */
export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    const posFromEnd = digits.length - i;
    out += digits[i];
    if (posFromEnd > 1 && posFromEnd % 3 === 1) out += '.';
  }
  return `${sign}$ ${out}`;
}

/** Parsea una entrada de usuario tipo "123.456" o "123456" a entero. Ignora todo lo no numerico. */
export function parseAmountInput(input: string): number {
  const digits = input.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10);
}

export function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDateHuman(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
