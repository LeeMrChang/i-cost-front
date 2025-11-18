// utils/request.js
const baseURL = 'http://127.0.0.1:9001/api';

function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, header = {} } = options;
    
    wx.request({
      url: `${baseURL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error('网络错误，请检查网络连接'));
      }
    });
  });
}

// 快捷方法
const http = {
  get: (url, data = {}) => request({ url, method: 'GET', data }),
  post: (url, data = {}) => request({ url, method: 'POST', data }),
  put: (url, data = {}) => request({ url, method: 'PUT', data }),
  delete: (url, data = {}) => request({ url, method: 'DELETE', data })
};

module.exports = { request, http };