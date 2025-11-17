const dataService = require('../../services/dataService');
const { ensureLogin } = require('../../utils/authGuard');
const { formatCurrency } = require('../../utils/format');

Page({
  data: {
    ledgers: [],
    form: {
      id: '',
      name: '',
      budget: '',
      remark: '',
      category: 'personal',
    },
    categoryIndex: 0,
    categories: [
      { value: 'personal', label: '个人' },
      { value: 'family', label: '家庭' },
      { value: 'travel', label: '旅行' },
      { value: 'business', label: '商务' },
    ],
  },
  onShow() {
    if (!ensureLogin()) {
      return;
    }
    this.loadLedgers();
  },
  loadLedgers() {
    const ledgers = dataService.listLedgers().map((ledger) => {
      const snapshot = dataService.getLedgerSnapshot(ledger.id);
      return Object.assign({}, ledger, {
        snapshot,
        expenseText: formatCurrency(snapshot.expense),
        incomeText: formatCurrency(snapshot.income),
        balanceText: formatCurrency(snapshot.balance),
        budgetRemainText: formatCurrency(snapshot.budgetRemain),
      });
    });
    this.setData({ ledgers });
  },
  resetForm() {
    this.setData({
      form: {
        id: '',
        name: '',
        budget: '',
        remark: '',
        category: 'personal',
      },
      categoryIndex: 0,
    });
  },
  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      form: Object.assign({}, this.data.form, { [field]: event.detail.value }),
    });
  },
  handleSubmit() {
    const { form } = this.data;
    if (!form.name) {
      wx.showToast({ title: '请输入账本名称', icon: 'none' });
      return;
    }
    dataService.upsertLedger({
      id: form.id,
      name: form.name,
      budget: Number(form.budget) || 0,
      remark: form.remark,
      category: form.category,
    });
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.resetForm();
    this.loadLedgers();
  },
  handleEdit(event) {
    const ledger = event.currentTarget.dataset.ledger;
    const categoryIndex = this.data.categories.findIndex((item) => item.value === ledger.category);
    this.setData({
      form: {
        id: ledger.id,
        name: ledger.name,
        budget: ledger.budget,
        remark: ledger.remark,
        category: ledger.category || 'personal',
      },
      categoryIndex: categoryIndex < 0 ? 0 : categoryIndex,
    });
  },
  handleCategoryChange(event) {
    const index = Number(event.detail.value);
    const target = this.data.categories[index];
    this.setData({
      categoryIndex: index,
      form: Object.assign({}, this.data.form, { category: target.value }),
    });
  },
  handleDelete(event) {
    const ledger = event.currentTarget.dataset.ledger;
    wx.showModal({
      title: '删除账本',
      content: `确认删除「${ledger.name}」？相关账单也会被移除。`,
      success: (res) => {
        if (res.confirm) {
          dataService.removeLedger(ledger.id);
          this.loadLedgers();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      },
    });
  },
});

