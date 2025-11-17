/**
 * 网络请求封装
 */
class Request {
  constructor() {
    this.baseURL = 'http://127.0.0.1:9001/dailyCost/api' // 替换为你的后端地址
    this.timeout = 10000
  }

  /**
   * 通用请求方法
   */
  async request(method, url, data = {}, options = {}) {
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    // 可在此处添加认证token
    const token = wx.getStorageSync('token')
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseURL}${url}`,
        method: method,
        data: data,
        header: header,
        timeout: this.timeout,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 接口成功
            resolve(res.data)
          } else {
            // 接口业务错误
            this._handleError(res, reject)
          }
        },
        fail: (err) => {
          // 网络错误
          this._handleNetworkError(err, reject)
        }
      })
    })
  }

  /**
   * 错误处理
   */
  _handleError(res, reject) {
    const errorMap = {
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求资源不存在',
      500: '服务器内部错误'
    }

    const message = res.data?.message || errorMap[res.statusCode] || '请求失败'
    
    // 显示错误提示
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })

    // 如果是401，跳转到登录页, todo 少了用户注册登录的页面
    if (res.statusCode === 401) {
      wx.navigateTo({
        url: '/pages/login/index'
      })
    }

    reject(new Error(message))
  }

  _handleNetworkError(err, reject) {
    wx.showToast({
      title: '网络连接失败，请检查网络',
      icon: 'none',
      duration: 2000
    })
    reject(err)
  }

  // 快捷方法
  get(url, data = {}, options = {}) {
    return this.request('GET', url, data, options)
  }

  post(url, data = {}, options = {}) {
    return this.request('POST', url, data, options)
  }

  put(url, data = {}, options = {}) {
    return this.request('PUT', url, data, options)
  }

  delete(url, data = {}, options = {}) {
    return this.request('DELETE', url, data, options)
  }
}

export default new Request()