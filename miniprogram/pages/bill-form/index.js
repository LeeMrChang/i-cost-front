const dataService = require('../../services/dataService');
const { ensureLogin } = require('../../utils/authGuard');
const { formatDate } = require('../../utils/format');

const reimburseOptions = [
  { label: '不报销', value: 'none' },
  { label: '待报销', value: 'pending' },
  { label: '已报销', value: 'done' },
];

const flowOptions = [
  { label: '结算/还款', value: 'repay' },
  { label: '收款', value: 'collection' },
  { label: '转账', value: 'transfer' },
  { label: '充值', value: 'topup' },
  { label: '借入', value: 'borrowIn' },
  { label: '借出', value: 'borrowOut' },
];

Page({
  data: {
    ledgerOptions: [],
    ledgerIndex: 0,
    typeOptions: [
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' },
      { label: '转账', value: 'transfer' },
    ],
    typeIndex: 0,
    categoryOptions: [],
    categoryIndex: 0,
    paymentOptions: ['微信', '支付宝', '现金', '银行卡'],
    paymentIndex: 0,
    reimburseIndex: 0,
    flowIndex: 2,
    form: {
      ledgerId: '',
      type: 'expense',
      categoryId: '',
      amount: '',
      payment: '微信',
      date: '',
      time: '',
      note: '',
      reimburseStatus: 'none',
      flowTag: 'transfer',
    },
  },
  onLoad() {
    if (!ensureLogin()) {
      return;
    }
    this.initializeForm();
  },
  initializeForm() {
    const ledgers = dataService.listLedgers();
    const now = new Date();
    const date = formatDate(now);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const categories = dataService.listCategories('expense');
    this.setData({
      ledgerOptions: ledgers,
      form: Object.assign({}, this.data.form, {
        ledgerId: ledgers[0] ? ledgers[0].id : '',
        categoryId: categories[0] ? categories[0].id : '',
        date,
        time,
      }),
      categoryOptions: categories,
      ledgerIndex: 0,
      categoryIndex: 0,
      typeIndex: 0,
      paymentIndex: 0,
      reimburseIndex: 0,
      flowIndex: 2,
    });
  },
  handleLedgerChange(event) {
    const index = event.detail.value;
    const ledgerId = this.data.ledgerOptions[index].id;
    this.setData({
      ledgerIndex: index,
      form: Object.assign({}, this.data.form, { ledgerId }),
    });
  },
  handleTypeChange(event) {
    const index = event.detail.value;
    const type = this.data.typeOptions[index].value;
    const categories = dataService.listCategories(type);
    this.setData({
      typeIndex: index,
      categoryOptions: categories,
      categoryIndex: 0,
      form: Object.assign({}, this.data.form, {
        type,
        categoryId: categories[0] ? categories[0].id : '',
      }),
    });
  },
  handleCategoryChange(event) {
    const index = event.detail.value;
    const categoryId = this.data.categoryOptions[index].id;
    this.setData({
      categoryIndex: index,
      form: Object.assign({}, this.data.form, { categoryId }),
    });
  },
  handlePaymentChange(event) {
    const index = event.detail.value;
    const payment = this.data.paymentOptions[index];
    this.setData({
      paymentIndex: index,
      form: Object.assign({}, this.data.form, { payment }),
    });
  },
  handleReimburseChange(event) {
    const index = event.detail.value;
    const reimburseStatus = reimburseOptions[index].value;
    this.setData({
      reimburseIndex: index,
      form: Object.assign({}, this.data.form, { reimburseStatus }),
    });
  },
  handleFlowChange(event) {
    const index = event.detail.value;
    const flowTag = flowOptions[index].value;
    this.setData({
      flowIndex: index,
      form: Object.assign({}, this.data.form, { flowTag }),
    });
  },
  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      form: Object.assign({}, this.data.form, { [field]: event.detail.value }),
    });
  },
  handleDateChange(event) {
    this.setData({
      form: Object.assign({}, this.data.form, { date: event.detail.value }),
    });
  },
  handleTimeChange(event) {
    this.setData({
      form: Object.assign({}, this.data.form, { time: event.detail.value }),
    });
  },
  handleSubmit() {
    const { form } = this.data;
    if (!form.amount) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    if (!form.categoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    const dateTime = `${form.date}T${form.time}:00`;
    dataService.addBill({
      ledgerId: form.ledgerId,
      type: form.type,
      categoryId: form.categoryId,
      amount: Number(form.amount),
      payment: form.payment,
      date: new Date(dateTime).toISOString(),
      note: form.note,
      reimburseStatus: form.reimburseStatus,
      flowTag: form.flowTag,
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 600);
  },
});

