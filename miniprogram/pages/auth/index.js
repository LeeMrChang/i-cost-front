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
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      nickname: '',
      realName: '',
      idCardNumber:'',
      gender: '',
      profile: '', // 用于存储头像临时路径
    },
    genderIndex: 0, //默认选男性
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
      form: Object.assign({}, this.data.form, { password: '', confirmPassword: '', profile: '' }),
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
    const {activeMode} = this.data;
    if (activeMode === 'login') {
      this.login();
    } else {
      this.register();
    }
  },

  // 登录方法
  async login() {
    const {phoneNumber, password} = this.data.form;
    // 表单验证
    if (!phoneNumber) {
      wx.showToast({ title: '请输入手机号码', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (!this.validatePhoneNumber(phoneNumber)) {
      wx.showToast({ title: '请输入正确的手机号码', icon: 'none' });
      return;
    }
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '登录中...', mask: true });
    try {
      // 调用登录接口
      const loginResult = await dataService.loginAccount({
        phoneNumber,
        password
      });
      console.log("登录成功",loginResult);
      this.finishSubmit(loginResult, '登录成功');
    } catch (error) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({ 
        title: error.message || '登录失败，请重试', 
        icon: 'none',
        duration: 2000
      });
    }
  },

  async register() {
    const {phoneNumber, password, confirmPassword, nickname, realName, idCardNumber, gender, profile } = this.data.form;
    // 表单验证
    if(!phoneNumber){
      wx.showToast({ title: '手机号码不能为空', icon: 'none' });
      return;
    }
    if (!phoneNumber || !password) {
      wx.showToast({ title: '请输入手机号码和密码', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (!profile) {
      wx.showToast({ title: '请上传头像', icon: 'none' });
      return;
    }
    if (!this.validatePhoneNumber(phoneNumber)) {
      wx.showToast({ title: '请输入正确的手机号码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码长度至少6位', icon: 'none' });
      return;
    }
    if(!nickname){
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    if(!realName){
      wx.showToast({ title: '真实姓名不能为空', icon: 'none' });
      return;
    }
    if(!idCardNumber){
      wx.showToast({ title: '身份证号码不能为空', icon: 'none' });
      return;
    }
    if(gender === null){
      wx.showToast({ title: '性别不能为空', icon: 'none' });
      return;
    }
    
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '注册中...', mask: true });

    try {
      // 1. 先上传头像到服务器
      // const avatarServerUrl = await this.uploadAvatar(profile);
      
      // if (!avatarServerUrl) {
      //   throw new Error('头像上传失败');
      // }

      // 2. 调用注册接口
      const registerResult = await dataService.registerAccount({
        phoneNumber,
        password,
        nickname,
        realName,
        idCardNumber,
        gender,
        profile: "http://daiweihu"
      });

      this.finishSubmit(registerResult, '注册成功');

    } catch (error) {
      // console.error('注册失败:', error);
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({ 
        title: error.message || '注册失败，请重试', 
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 上传头像到服务器
  uploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://your-api-domain.com/api/upload/avatar', // 替换为你的实际上传接口
        filePath: filePath,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${dataService.getToken()}` // 如果有token的话
        },
        success: (res) => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data);
              if (data.success && data.data && data.data.url) {
                resolve(data.data.url); // 返回服务器上的头像URL
              } else {
                reject(new Error(data.message || '头像上传失败'));
              }
            } catch (e) {
              reject(new Error('解析响应数据失败'));
            }
          } else {
            reject(new Error(`上传失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(new Error('网络错误，请检查网络连接'));
        }
      });
    });
  },

  finishSubmit(result, successMessage) {
    wx.hideLoading();
    this.setData({ isSubmitting: false });
    
    if (!result.success) {
      wx.showToast({ 
        title: result.message || '操作失败', 
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showToast({ 
      title: successMessage, 
      icon: 'success',
      duration: 1500
    });

    // 如果是注册成功，保存用户信息
    if (result.data) {
      dataService.setUser(result.data);
      if (result.data.token) {
        dataService.setToken(result.data.token);
      }
    }

    setTimeout(() => {
      wx.switchTab({ url: '/pages/dashboard/index' });
    }, 1500);
  },

  onChooseImage: function() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 使用压缩图片减少上传大小
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        // 先显示预览
        that.setData({
          form: Object.assign({}, that.data.form, { profile: tempFilePaths[0] })
        });
        // 可以在这里添加图片压缩逻辑
        that.compressImage(tempFilePaths[0]);
      },
      fail(err) {
        console.error('选择图片失败:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  validatePhoneNumber: function (phoneNumber) {
    // 正则表达式，用于匹配中国大陆的手机号码格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    // 检查手机号码长度和格式
    if (!phoneRegex.test(phoneNumber)) {
      wx.showToast({
        title: '请输入有效的手机号码',
        icon: 'none'
      });
      return false;
    }
    // 手机号码验证通过
    return true;
  },

  onGenderChange: function(e) {
    const genderIndex = parseInt(e.detail.value); // 确保是数字
    console.log('Gender index:', genderIndex);
    this.setData({
      form: Object.assign({}, this.data.form, { gender: genderIndex })
    });
  },

  // 图片压缩（可选）
  compressImage(filePath) {
    wx.compressImage({
      src: filePath,
      quality: 80, // 压缩质量 0-100
      success: (res) => {
        // 使用压缩后的图片路径
        this.setData({
          form: Object.assign({}, this.data.form, { profile: res.tempFilePath })
        });
      }
    });
  },

  goBackHome() {
    wx.switchTab({ url: '/pages/dashboard/index' });
  },
});