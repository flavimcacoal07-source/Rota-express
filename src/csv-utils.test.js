import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCsv } from './csv-utils.js';

test('gera CSV compatível com planilhas brasileiras usando BOM e ponto e vírgula', () => {
  const csv = buildCsv(['Nome', 'Valor'], [{ name: 'João', amount: 'R$ 1.234,56' }], row => [row.name, row.amount]);
  assert.equal(csv, '\uFEFF"Nome";"Valor"\r\n"João";"R$ 1.234,56"\r\n');
});

test('escapa aspas, separadores e quebras de linha dentro das células', () => {
  const csv = buildCsv(['Descrição'], [{ value: 'Pedágio; "BR-101"\nTrecho sul' }], row => [row.value]);
  assert.equal(csv, '\uFEFF"Descrição"\r\n"Pedágio; ""BR-101""\nTrecho sul"\r\n');
});

test('neutraliza fórmulas em texto para reduzir risco de CSV injection', () => {
  const csv = buildCsv(['Texto', 'Outro'], [{ a: '=HYPERLINK("https://exemplo.com")', b: '\t+cmd' }], row => [row.a, row.b]);
  assert.match(csv, /"'=HYPERLINK/);
  assert.match(csv, /"'\t\+cmd/);
});

test('preserva valores numéricos como números, inclusive negativos', () => {
  const csv = buildCsv(['Quantidade'], [{ value: -12.5 }], row => [row.value]);
  assert.equal(csv, '\uFEFF"Quantidade"\r\n"-12.5"\r\n');
});

test('exporta apenas o cabeçalho quando a lista está vazia', () => {
  assert.equal(buildCsv(['Nome'], []), '\uFEFF"Nome"\r\n');
});
