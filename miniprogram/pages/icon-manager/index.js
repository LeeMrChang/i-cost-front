const dataService = require('../../services/dataService');
const { ensureLogin } = require('../../utils/authGuard');

Page({
  data: {
    tabs: [
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' },
      { label: '转账', value: 'transfer' },
    ],
    activeTab: 'expense',
    categories: [],
    form: {
      name: '',
      icon: '',
      type: 'expense',
      parentId: 0,
    },
  },
  onShow() {
    if (!ensureLogin()) {
      return;
    }
    this.loadCategories();
  },
  loadCategories() {
    const categories = dataService.listCategories(this.data.activeTab);
    this.setData({ categories });
  },
  handleTabChange(event) {
    const value = event.currentTarget.dataset.value;
    this.setData(
      {
        activeTab: value,
        form: Object.assign({}, this.data.form, { type: value }),
      },
      () => this.loadCategories()
    );
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
      wx.showToast({ title: '请输入图标名称', icon: 'none' });
      return;
    }
    dataService.addCategory(form);
    wx.showToast({ title: '已新增', icon: 'success' });
    this.setData({
      form: Object.assign({}, form, { name: '', icon: '' }),
    });
    this.loadCategories();
  },
});

