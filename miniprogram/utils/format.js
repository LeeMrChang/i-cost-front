function formatCurrency(value, prefix = '¥') {
  const number = Number(value || 0);
  return `${prefix}${number.toFixed(2)}`;
}

function formatNumber(value, digits = 2) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? `${number}` : number.toFixed(digits);
}

function toDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

function formatDate(value) {
  const date = toDate(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDateTime(value) {
  const date = toDate(value);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(date)} ${hour}:${minute}`;
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toFixed(1)}%`;
}

module.exports = {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatPercent,
};

