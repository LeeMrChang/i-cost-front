const dataService = require('../../services/dataService');
const { ensureLogin } = require('../../utils/authGuard');
const { formatCurrency, formatPercent } = require('../../utils/format');

function describeRange(range) {
  if (!range) return '';
  const { start, end, mode } = range;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startText = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;
  const endText = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
  if (mode === 'month') {
    return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')} 月`;
  }
  if (mode === 'year') {
    return `${startDate.getFullYear()} 年`;
  }
  if (mode === 'week') {
    return `本周 ${startText} ~ ${endText}`;
  }
  if (mode === 'range') {
    return `${startText} ~ ${endText}`;
  }
  return '全部数据';
}

Page({
  data: {
    timeModes: [
      { label: '周', value: 'week' },
      { label: '月', value: 'month' },
      { label: '年', value: 'year' },
      { label: '全部', value: 'all' },
      { label: '自定义', value: 'range' },
    ],
    activeMode: 'month',
    statistics: null,
    rangeLabel: '',
    customRange: {
      start: '',
      end: '',
    },
  },
  onShow() {
    if (!ensureLogin()) {
      return;
    }
    this.loadStatistics();
  },
  loadStatistics() {
    const option = { mode: this.data.activeMode };
    if (this.data.activeMode === 'range') {
      option.start = this.data.customRange.start;
      option.end = this.data.customRange.end;
    }
    const statistics = dataService.getStatistics(option);
    const rangeLabel = describeRange(statistics.range);
    const expenseBreakdown = statistics.expenseBreakdown.map((item) => ({
      name: item.name,
      amount: formatCurrency(item.amount),
      percent: formatPercent(item.percent),
    }));
    const incomeBreakdown = statistics.incomeBreakdown.map((item) => ({
      name: item.name,
      amount: formatCurrency(item.amount),
      percent: formatPercent(item.percent),
    }));
    const ledgerSummary = statistics.ledgerSummary.map((item) => ({
      ledgerName: item.ledgerName,
      expense: formatCurrency(item.expense),
      income: formatCurrency(item.income),
    }));
    this.setData({
      statistics: Object.assign({}, statistics, {
        totals: {
          expense: formatCurrency(statistics.totals.expense),
          income: formatCurrency(statistics.totals.income),
          balance: formatCurrency(statistics.totals.balance),
          transfer: formatCurrency(statistics.totals.transfer),
        },
        reimburse: {
          pending: formatCurrency(statistics.reimburse.pending),
          done: formatCurrency(statistics.reimburse.done),
        },
        expenseBreakdown,
        incomeBreakdown,
        ledgerSummary,
        flowSummary: statistics.flowSummary.map((item) => ({
          flowTag: item.flowTag,
          amount: formatCurrency(item.amount),
        })),
      }),
      rangeLabel,
    });
  },
  handleModeChange(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ activeMode: value }, () => {
      if (value === 'range' && (!this.data.customRange.start || !this.data.customRange.end)) {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        this.setData(
          {
            customRange: {
              start: `${today.getFullYear()}-${month}-${day}`,
              end: `${today.getFullYear()}-${month}-${day}`,
            },
          },
          () => this.loadStatistics()
        );
      } else {
        this.loadStatistics();
      }
    });
  },
  handleRangeChange(event) {
    const type = event.currentTarget.dataset.type;
    const value = event.detail.value;
    this.setData(
      {
        customRange: Object.assign({}, this.data.customRange, { [type]: value }),
      },
      () => this.loadStatistics()
    );
  },
});

