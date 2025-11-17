const dataService = require('../../services/dataService');

const modeTabs = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
];

Page({
  data: {
    modeTabs,
    activeMode: 'login',
    form: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    //tips: '体验账号：demo / 123456',
    isSubmitting: false,
  },
  onLoad(options) {
    this.forceStay = options && options.force === '1';
    if (options && options.mode && (options.mode === 'login' || options.mode === 'register')) {
      this.setData({ activeMode: options.mode });
    }
  },
  onShow() {
    if (this.forceStay) {
      return;
    }
    const user = dataService.getUser();
    if (user && user.id) {
      wx.switchTab({ url: '/pages/dashboard/index' });
    }
  },
  switchMode(event) {
    const mode = event.currentTarget.dataset.mode;
    if (mode === this.data.activeMode) return;
    this.setData({
      activeMode: mode,
      form: Object.assign({}, this.data.form, { password: '', confirmPassword: '' }),
    });
  },
  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      form: Object.assign({}, this.data.form, { [field]: event.detail.value }),
    });
  },
  handleSubmit() {
    if (this.data.isSubmitting) return;
    const { activeMode } = this.data;
    if (activeMode === 'login') {
      this.login();
    } else {
      this.register();
    }
  },
  login() {
    const { username, password } = this.data.form;
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    this.setData({ isSubmitting: true });
    const result = dataService.loginAccount({ username, password });
    this.finishSubmit(result, '登录成功');
  },
  register() {
    const { username, password, confirmPassword, name } = this.data.form;
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    this.setData({ isSubmitting: true });
    const result = dataService.registerAccount({
      username,
      password,
      name: name || username,
    });
    this.finishSubmit(result, '注册成功');
  },
  finishSubmit(result, successMessage) {
    this.setData({ isSubmitting: false });
    if (!result.success) {
      wx.showToast({ title: result.message || '操作失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: successMessage, icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/dashboard/index' });
    }, 600);
  },
  goBackHome() {
    wx.switchTab({ url: '/pages/dashboard/index' });
  },
});

