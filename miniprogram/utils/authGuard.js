const dataService = require('../services/dataService');

function ensureLogin(options = {}) {
  const user = dataService.getUser();
  if (user && user.id) {
    return true;
  }
  if (!options.silent) {
    wx.showToast({ title: '请先登录账号', icon: 'none' });
  }
  const method = options.redirect === 'reLaunch' ? 'reLaunch' : 'redirectTo';
  wx[method]({
    url: '/pages/auth/index',
  });
  return false;
}

module.exports = {
  ensureLogin,
};

