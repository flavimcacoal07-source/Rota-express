export function normalizeRecordValues(key, values, {
  isEditing = false,
  userId = null,
  driverCommission = null,
} = {}) {
  const data = { ...values };

  if (key === 'drivers' && (data.commission_percent === null || data.commission_percent === undefined)) {
    data.commission_percent = 15;
  }

  if (key === 'trips') {
    if (data.origin_state) data.origin_state = String(data.origin_state).toUpperCase();
    if (data.destination_state) data.destination_state = String(data.destination_state).toUpperCase();
    if (data.toll_mode === 'a_parte') data.toll_amount = null;

    if (!isEditing) {
      data.created_by = userId;
      data.status = 'rascunho';
      data.commission_percent_snapshot = driverCommission ?? null;
    }
  }

  if (!isEditing && ['driver_advances', 'maintenance_records', 'advance_settlements'].includes(key)) {
    data.created_by = userId;
  }

  if (key === 'trip_expenses' && data.expense_at) {
    data.expense_at = new Date(data.expense_at).toISOString();
  }
  if (key === 'fuelings' && data.fueling_at) {
    data.fueling_at = new Date(data.fueling_at).toISOString();
  }

  return data;
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}
