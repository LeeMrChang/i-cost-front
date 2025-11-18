const dataService = require('../../services/dataService');
const { ensureLogin } = require('../../utils/authGuard');
const { formatCurrency } = require('../../utils/format');

function buildLedgerView(snapshot) {
  if (!snapshot) {
    return {};
  }
  return {
    expense: formatCurrency(snapshot.expense),
    income: formatCurrency(snapshot.income),
    transfer: formatCurrency(snapshot.transfer),
    budget: formatCurrency(snapshot.budget),
    budgetRemain: formatCurrency(snapshot.budgetRemain),
    balance: formatCurrency(snapshot.balance),
    reimbursePending: formatCurrency(snapshot.reimbursePending),
    reimburseDone: formatCurrency(snapshot.reimburseDone),
    budgetUsage: snapshot.budget
      ? Math.min(100, Math.round((snapshot.expense / snapshot.budget) * 100))
      : 0,
  };
}

function buildTotalsView(totals) {
  if (!totals) return {};
  return {
    expense: formatCurrency(totals.expense),
    income: formatCurrency(totals.income),
    balance: formatCurrency(totals.balance),
    transfer: formatCurrency(totals.transfer),
  };
}

Page({
  data: {
    user: {},
    userView: {},
    ledgerOptions: [],
    selectedLedgerId: '',
    pickerIndex: 0,
    ledgerSnapshot: null,
    ledgerView: {},
    totalsView: {},
    reimburseView: {},
    statistics: null,
  },
  onShow() {
    if (!ensureLogin({ redirect: 'reLaunch' })) {
      return;
    }
    this.loadDashboard();
  },
  loadDashboard() {
    const user = dataService.getUserInfo();
    const userView = {
      totalAssets: formatCurrency(user.totalAssets)
    };
    const ledgers = dataService.listLedgers();
    const selectedLedgerId = this.data.selectedLedgerId || (ledgers[0] && ledgers[0].id);
    const snapshot = selectedLedgerId
      ? dataService.getLedgerSnapshot(selectedLedgerId)
      : null;
    const quick = dataService.getQuickSnapshot();
    const ledgerView = buildLedgerView(snapshot);
    const totalsView = buildTotalsView(quick.statistics.totals);
    const reimburseView = {
      pending: formatCurrency(quick.reimburse.pending),
      done: formatCurrency(quick.reimburse.done),
    };
    this.setData({
      user,
      userView,
      ledgerOptions: ledgers,
      selectedLedgerId,
      pickerIndex: Math.max(
        0,
        ledgers.findIndex((item) => item.id === selectedLedgerId)
      ),
      ledgerSnapshot: snapshot,
      ledgerView,
      statistics: quick.statistics,
      totalsView,
      reimburseView,
    });
  },
  handleLedgerChange(event) {
    const index = event.detail.value;
    const selectedLedgerId = this.data.ledgerOptions[index].id;
    const snapshot = dataService.getLedgerSnapshot(selectedLedgerId);
    this.setData({
      selectedLedgerId,
      pickerIndex: index,
      ledgerSnapshot: snapshot,
      ledgerView: buildLedgerView(snapshot),
    });
  },
  goToBillForm() {
    wx.navigateTo({ url: '/pages/bill-form/index' });
  },
  goToLedger() {
    wx.switchTab({ url: '/pages/ledger/index' });
  },
  goToStatistics() {
    wx.switchTab({ url: '/pages/statistics/index' });
  },
  goToIconManager() {
    wx.navigateTo({ url: '/pages/icon-manager/index' });
  },
  goToAuth() {
    wx.navigateTo({ url: '/pages/auth/index?force=1' });
  },
  logoutAccount() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用 dataService 的退出登录方法
          dataService.logoutAccount();
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });
          //跳转到登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/auth/index'
            });
          }, 1500);
        }
      }
    });
  }
});

