import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinance } from './finance.js';

test('soma frete, pedágio e comissão somente de viagens aprovadas', () => {
  const result = calculateFinance({
    trips: [
      { status: 'aprovada', freight_gross: 10000, commission_percent_snapshot: 10, toll_mode: 'por_conta_da_empresa', toll_amount: 250 },
      { status: 'aprovada', freight_gross: 5000, commission_percent_snapshot: null, toll_mode: 'a_parte', toll_amount: null },
      { status: 'pendente', freight_gross: 9000, commission_percent_snapshot: 20, toll_mode: 'por_conta_da_empresa', toll_amount: 300 },
    ],
  });

  assert.equal(result.freight, 15000);
  assert.equal(result.commission, 1000);
  assert.equal(result.commissionTripsCount, 1);
  assert.equal(result.tolls, 250);
  assert.equal(result.approvedTripsCount, 2);
  assert.equal(result.pendingTripsCount, 1);
});

test('consolida lançamentos operacionais e saldo dos adiantamentos', () => {
  const result = calculateFinance({
    fuelings: [{ total_amount: 120 }, { total_amount: 80 }],
    expenses: [{ amount: 35.5 }, { amount: 14.5 }],
    maintenance: [{ amount: 300 }, { amount: null }],
    advances: [{ amount: 1000 }, { amount: 500 }],
    settlements: [{ amount_applied: 600 }, { amount_applied: 250 }],
  });

  assert.equal(result.fuel, 200);
  assert.equal(result.expenses, 50);
  assert.equal(result.maintenance, 300);
  assert.equal(result.advances, 1500);
  assert.equal(result.settled, 850);
  assert.equal(result.advanceBalance, 650);
});

test('trata valores nulos ou inválidos como zero e aceita comissão de zero por cento', () => {
  const result = calculateFinance({
    trips: [
      { status: 'aprovada', freight_gross: 'inválido', commission_percent_snapshot: 0, toll_mode: 'por_conta_da_empresa', toll_amount: null },
    ],
    fuelings: [{ total_amount: null }, { total_amount: 'não numérico' }],
  });

  assert.equal(result.freight, 0);
  assert.equal(result.commission, 0);
  assert.equal(result.commissionTripsCount, 1);
  assert.equal(result.tolls, 0);
  assert.equal(result.fuel, 0);
});
