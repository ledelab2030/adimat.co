import { describe, expect, it } from 'vitest';
import { formatCOP, parseAmountInput } from './format';

describe('formatCOP', () => {
  it('agrega separadores de miles con puntos y el simbolo de peso', () => {
    expect(formatCOP(1234567)).toBe('$ 1.234.567');
    expect(formatCOP(0)).toBe('$ 0');
    expect(formatCOP(999)).toBe('$ 999');
    expect(formatCOP(1000)).toBe('$ 1.000');
  });

  it('nunca muestra decimales (redondea)', () => {
    expect(formatCOP(1234.6)).toBe('$ 1.235');
  });

  it('maneja negativos', () => {
    expect(formatCOP(-5000)).toBe('-$ 5.000');
  });
});

describe('parseAmountInput', () => {
  it('extrae solo digitos de una entrada formateada', () => {
    expect(parseAmountInput('$ 1.234.567')).toBe(1234567);
    expect(parseAmountInput('45000')).toBe(45000);
    expect(parseAmountInput('')).toBe(0);
    expect(parseAmountInput('abc')).toBe(0);
  });
});
