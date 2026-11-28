import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecordValues, toDateTimeLocal } from './record-utils.js';

test('criação de viagem grava autor, rascunho e snapshot de comissão', () => {
  const result = normalizeRecordValues('trips', {
    origin_state: 'ro',
    destination_state: 'mt',
    toll_mode: 'a_parte',
    toll_amount: 125,
  }, { userId: 'gestor-1', driverCommission: 12.5 });

  assert.equal(result.created_by, 'gestor-1');
  assert.equal(result.status, 'rascunho');
  assert.equal(result.commission_percent_snapshot, 12.5);
  assert.equal(result.origin_state, 'RO');
  assert.equal(result.destination_state, 'MT');
  assert.equal(result.toll_amount, null);
});

test('edição de viagem não regrava autor, status ou snapshot histórico', () => {
  const result = normalizeRecordValues('trips', {
    origin_state: 'sp',
    destination_state: 'mg',
    toll_mode: 'por_conta_da_empresa',
    toll_amount: 80,
  }, { isEditing: true, userId: 'outro-usuario', driverCommission: 25 });

  assert.equal(result.origin_state, 'SP');
  assert.equal(result.destination_state, 'MG');
  assert.equal(result.created_by, undefined);
  assert.equal(result.status, undefined);
  assert.equal(result.commission_percent_snapshot, undefined);
});

test('edição de adiantamento não substitui o autor original', () => {
  const result = normalizeRecordValues('driver_advances', {
    driver_id: 'motorista-1',
    amount: 500,
    advance_date: '2026-11-24',
  }, { isEditing: true, userId: 'gestor-2' });

  assert.equal(result.created_by, undefined);
  assert.equal(result.amount, 500);
});

test('converte datas locais de abastecimentos e despesas para ISO', () => {
  const localValue = '2026-11-24T09:30';
  assert.equal(
    normalizeRecordValues('fuelings', { fueling_at: localValue }).fueling_at,
    new Date(localValue).toISOString()
  );
  assert.equal(
    normalizeRecordValues('trip_expenses', { expense_at: localValue }).expense_at,
    new Date(localValue).toISOString()
  );
});

test('prepara valor ISO para campo datetime-local sem deslocar o instante', () => {
  const iso = '2026-11-24T12:30:00.000Z';
  const local = toDateTimeLocal(iso);
  assert.equal(new Date(local).toISOString(), iso);
});
