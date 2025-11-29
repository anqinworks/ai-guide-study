/**
 * 用户反馈工具 - 统一管理所有用户提示信息
 * 确保提示信息通俗易懂、友好明确
 */

/**
 * 显示成功提示
 * @param {string} message - 提示信息
 * @param {number} duration - 显示时长（毫秒）
 */
const showSuccess = (message, duration = 1500) => {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: duration,
    mask: false
  })
}

/**
 * 显示错误提示
 * @param {string} message - 错误信息
 * @param {number} duration - 显示时长（毫秒）
 */
const showError = (message, duration = 2000) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: duration,
    mask: false
  })
}

/**
 * 显示警告提示
 * @param {string} message - 警告信息
 * @param {number} duration - 显示时长（毫秒）
 */
const showWarning = (message, duration = 2000) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: duration,
    mask: false
  })
}

/**
 * 显示信息提示（无图标）
 * @param {string} message - 提示信息
 * @param {number} duration - 显示时长（毫秒）
 */
const showInfo = (message, duration = 2000) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: duration,
    mask: false
  })
}

/**
 * 显示加载提示
 * @param {string} message - 加载提示信息
 */
const showLoading = (message = '加载中...') => {
  wx.showLoading({
    title: message,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示确认对话框
 * @param {object} options - 配置选项
 * @param {string} options.title - 标题
 * @param {string} options.content - 内容
 * @param {string} options.confirmText - 确认按钮文字
 * @param {string} options.cancelText - 取消按钮文字
 * @returns {Promise<boolean>} - 返回用户选择（true为确认，false为取消）
 */
const showConfirm = (options = {}) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content: options.content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      confirmColor: '#667eea',
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 处理错误信息，转换为用户友好的提示
 * @param {Error|string} error - 错误对象或错误信息
 * @returns {string} - 用户友好的错误提示
 */
const formatErrorMessage = (error) => {
  if (!error) {
    return '操作失败，请稍后重试'
  }

  const errorMessage = typeof error === 'string' ? error : error.message || '操作失败'

  // 网络相关错误
  if (errorMessage.includes('网络') || errorMessage.includes('连接') || errorMessage.includes('timeout')) {
    return '网络连接异常，请检查网络后重试'
  }

  if (errorMessage.includes('ERR_CONNECTION_REFUSED') || errorMessage.includes('连接失败')) {
    return '无法连接到服务器，请稍后重试'
  }

  // 认证相关错误
  if (errorMessage.includes('未授权') || errorMessage.includes('401') || errorMessage.includes('登录')) {
    return '登录已过期，请重新登录'
  }

  // 权限相关错误
  if (errorMessage.includes('无权') || errorMessage.includes('403') || errorMessage.includes('权限')) {
    return '您没有权限执行此操作'
  }

  // 资源不存在
  if (errorMessage.includes('不存在') || errorMessage.includes('404') || errorMessage.includes('未找到')) {
    return '请求的内容不存在'
  }

  // 参数错误
  if (errorMessage.includes('参数') || errorMessage.includes('400')) {
    return '输入信息有误，请检查后重试'
  }

  // 服务器错误
  if (errorMessage.includes('500') || errorMessage.includes('服务器')) {
    return '服务器繁忙，请稍后重试'
  }

  // 任务相关错误
  if (errorMessage.includes('任务已过期') || errorMessage.includes('任务不存在')) {
    return '生成任务已过期，请重新生成'
  }

  if (errorMessage.includes('生成的卡片为空')) {
    return '未能生成卡片，请重新尝试'
  }

  // 默认返回原始错误信息（如果已经是友好提示）
  return errorMessage
}

/**
 * 显示错误提示（自动格式化错误信息）
 * @param {Error|string} error - 错误对象或错误信息
 * @param {string} defaultMessage - 默认错误信息
 */
const showFormattedError = (error, defaultMessage = '操作失败，请稍后重试') => {
  const message = formatErrorMessage(error) || defaultMessage
  showError(message)
}

/**
 * 显示登录提示
 */
const showLoginPrompt = () => {
  return showConfirm({
    title: '需要登录',
    content: '此功能需要登录后才能使用，是否前往登录？',
    confirmText: '去登录',
    cancelText: '取消'
  })
}

module.exports = {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  hideLoading,
  showConfirm,
  formatErrorMessage,
  showFormattedError,
  showLoginPrompt
}

