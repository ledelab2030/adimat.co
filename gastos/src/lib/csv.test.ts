import { describe, expect, it } from 'vitest';
import { parseCsv, toCsvRow } from './csv';

describe('parseCsv', () => {
  it('parsea filas simples separadas por comas', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3']
    ]);
  });

  it('respeta campos entre comillas que contienen comas', () => {
    expect(parseCsv('"Almuerzo, con el equipo",20000')).toEqual([['Almuerzo, con el equipo', '20000']]);
  });

  it('maneja comillas escapadas ("")', () => {
    expect(parseCsv('"Dijo ""hola""",1')).toEqual([['Dijo "hola"', '1']]);
  });

  it('round-trip con toCsvRow produce el mismo contenido al volver a parsear', () => {
    const original = ['Nota con, coma', 'Nota con "comillas"', '12345'];
    const line = toCsvRow(original);
    expect(parseCsv(line)[0]).toEqual(original);
  });
});
