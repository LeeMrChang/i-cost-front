const dataService = require('../../services/dataService');
const { ensureLogin } = require('../../utils/authGuard');
const { formatCurrency } = require('../../utils/format');

function buildDisplay(assets, mask) {
  if (mask) {
    return {
      netAsset: '****',
      totalAssets: '****',
      totalDebt: '****',
      borrowIn: '****',
      borrowOut: '****',
    };
  }
  return {
    netAsset: formatCurrency(assets.netAsset),
    totalAssets: formatCurrency(assets.totalAssets),
    totalDebt: formatCurrency(assets.totalDebt),
    borrowIn: formatCurrency(assets.borrowIn),
    borrowOut: formatCurrency(assets.borrowOut),
  };
}

Page({
  data: {
    assets: {},
    display: {},
    mask: true,
    form: {
      totalAssets: '',
      totalDebt: '',
      borrowIn: '',
      borrowOut: '',
    },
  },
  onShow() {
    if (!ensureLogin()) {
      return;
    }
    this.loadAssets();
  },
  loadAssets() {
    const assets = dataService.getAssetsSummary();
    this.setData({
      assets,
      display: buildDisplay(assets, this.data.mask),
      form: {
        totalAssets: assets.totalAssets,
        totalDebt: assets.totalDebt,
        borrowIn: assets.borrowIn,
        borrowOut: assets.borrowOut,
      },
    });
  },
  toggleMask() {
    const mask = !this.data.mask;
    this.setData({
      mask,
      display: buildDisplay(this.data.assets, mask),
    });
  },
  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      form: Object.assign({}, this.data.form, { [field]: event.detail.value }),
    });
  },
  handleSave() {
    const payload = {
      totalAssets: Number(this.data.form.totalAssets) || 0,
      totalDebt: Number(this.data.form.totalDebt) || 0,
      borrowIn: Number(this.data.form.borrowIn) || 0,
      borrowOut: Number(this.data.form.borrowOut) || 0,
    };
    dataService.updateAssets(payload);
    wx.showToast({ title: '已更新', icon: 'success' });
    this.loadAssets();
  },
});

