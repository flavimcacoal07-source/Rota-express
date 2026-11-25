import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndPaginate } from './table-utils.js';

test('busca ignora maiúsculas e acentos', () => {
  const rows = [{ name: 'João da Silva' }, { name: 'Maria Souza' }];
  const result = filterAndPaginate(rows, 'JOAO', 1, 25, row => row.name);
  assert.equal(result.total, 1);
  assert.equal(result.pageRows[0].name, 'João da Silva');
});

test('limita a página solicitada e informa o intervalo correto', () => {
  const rows = Array.from({ length: 52 }, (_, index) => ({ id: index + 1 }));
  const result = filterAndPaginate(rows, '', 99, 25, row => row.id);
  assert.equal(result.page, 3);
  assert.equal(result.pageCount, 3);
  assert.equal(result.pageRows.length, 2);
  assert.equal(result.startIndex, 51);
  assert.equal(result.endIndex, 52);
});

test('retorna estado vazio quando não há correspondências', () => {
  const result = filterAndPaginate([{ name: 'Caminhão' }], 'carreta', 1, 25, row => row.name);
  assert.equal(result.total, 0);
  assert.equal(result.pageRows.length, 0);
  assert.equal(result.page, 1);
  assert.equal(result.pageCount, 1);
});

test('usa valores seguros para página e tamanho inválidos', () => {
  const result = filterAndPaginate([{ id: 1 }, { id: 2 }], '', -3, 0, row => row.id);
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 25);
  assert.equal(result.pageRows.length, 2);
});
