const amount = value => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sum = (rows, key) => rows.reduce((total, row) => total + amount(row[key]), 0);

export function calculateFinance({
  trips = [],
  fuelings = [],
  expenses = [],
  maintenance = [],
  advances = [],
  settlements = [],
} = {}) {
  const approvedTrips = trips.filter(trip => trip.status === 'aprovada');
  const commissionTrips = approvedTrips.filter(trip =>
    trip.commission_percent_snapshot !== null &&
    trip.commission_percent_snapshot !== undefined &&
    Number.isFinite(Number(trip.commission_percent_snapshot))
  );

  const advanceTotal = sum(advances, 'amount');
  const settledTotal = sum(settlements, 'amount_applied');

  return {
    freight: sum(approvedTrips, 'freight_gross'),
    commission: commissionTrips.reduce(
      (total, trip) =>
        total + amount(trip.freight_gross) * amount(trip.commission_percent_snapshot) / 100,
      0
    ),
    commissionTripsCount: commissionTrips.length,
    fuel: sum(fuelings, 'total_amount'),
    expenses: sum(expenses, 'amount'),
    maintenance: sum(maintenance, 'amount'),
    tolls: sum(
      approvedTrips.filter(trip => trip.toll_mode === 'por_conta_da_empresa'),
      'toll_amount'
    ),
    advances: advanceTotal,
    settled: settledTotal,
    advanceBalance: advanceTotal - settledTotal,
    pendingTripsCount: trips.filter(trip => trip.status === 'pendente').length,
    approvedTripsCount: approvedTrips.length,
  };
}
