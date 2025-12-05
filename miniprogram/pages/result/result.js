// pages/result/result.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')
const richTextParser = require('../../utils/richTextParser')

Page({
  data: {
    correct: false,
    userAnswer: '',
    userAnswerHtml: '',
    correctAnswer: '',
    correctAnswerHtml: '',
    explanation: '',
    explanationHtml: '',
    hasNext: false
  },

  onLoad(options) {
    const app = getApp()
    const currentIndex = app.globalData.currentCardIndex || 0
    const qaCards = app.globalData.qaCards || []
    const answerResults = app.globalData.answerResults || []
    
    // 确保currentIndex在有效范围内
    const safeIndex = Math.min(Math.max(0, currentIndex), qaCards.length - 1)
    const currentCard = qaCards[safeIndex]
    const answerResult = answerResults[safeIndex]
    
    console.log('结果页面 - 当前索引:', currentIndex)
    console.log('结果页面 - 安全索引:', safeIndex)
    console.log('结果页面 - 当前卡片:', currentCard)
    console.log('结果页面 - 答题结果:', answerResult)
    console.log('结果页面 - URL参数:', options)
    console.log('结果页面 - 卡片列表长度:', qaCards.length)
    console.log('结果页面 - 结果列表长度:', answerResults.length)
    
    // 计算是否有下一题：根据当前题目索引判断
    // currentIndex表示当前题目索引
    // qaCards.length表示总题目数量
    // 如果当前索引+1小于总数量，说明还有下一题
    const hasNext = currentIndex + 1 < qaCards.length
    
    // 确保currentCard存在
    if (!currentCard) {
      console.error('结果页面 - 当前卡片不存在，使用默认值')
      this.setData({
        correct: options.correct === 'true',
        userAnswer: '',
        correctAnswer: '无正确答案',
        explanation: '',
        hasNext: hasNext
      })
      return
    }
    
    // 确保correctAnswer有值，如果没有则使用默认值
    let correctAnswer = currentCard.correctAnswer
    if (!correctAnswer) {
      console.error('结果页面 - 正确答案为空，使用默认值')
      // 如果correctAnswer为空，尝试从选项中找出正确答案
      // 对于AI生成的卡片，正确答案应该是选项中的第一个
      correctAnswer = currentCard.options ? (currentCard.options[0] || '无正确答案') : '无正确答案'
    }
    
    // 解析富文本内容
    const explanationHtml = richTextParser.parseRichText(currentCard.explanation || '')
    const correctAnswerHtml = richTextParser.parseRichText(correctAnswer || '')
    const userAnswerHtml = richTextParser.parseRichText(answerResult ? answerResult.userAnswer || '' : '')
    
    this.setData({
      correct: options.correct === 'true',
      userAnswer: answerResult ? answerResult.userAnswer || '' : '',
      userAnswerHtml: userAnswerHtml,
      correctAnswer: correctAnswer,
      correctAnswerHtml: correctAnswerHtml,
      explanation: currentCard.explanation || '',
      explanationHtml: explanationHtml,
      hasNext: hasNext
    })
  },

  goToNext() {
    const app = getApp()
    const currentIndex = app.globalData.currentCardIndex || 0
    const qaCards = app.globalData.qaCards || []
    
    // 实时判断是否还有下一题，不依赖可能过期的this.data.hasNext
    const hasNext = currentIndex + 1 < qaCards.length
    
    console.log('goToNext - 当前索引:', currentIndex, '总题数:', qaCards.length, '是否有下一题:', hasNext)
    
    if (hasNext) {
      // 进入下一题
      // 先更新索引
      app.globalData.currentCardIndex++
      
      console.log('准备进入下一题，新索引:', app.globalData.currentCardIndex)
      
      // 返回上一个答题页面（关闭当前的result页面）
      // 答题页面会在onShow中检测到索引变化并重新加载数据
      // 这样可以避免页面栈过深，保持页面栈深度不变
      wx.navigateBack({
        delta: 1,
        success: () => {
          console.log('成功返回答题页面，索引已更新为:', app.globalData.currentCardIndex)
          // 答题页面会在onShow中检测到索引变化并重新加载新的题目
        },
        fail: (err) => {
          console.error('返回答题页面失败:', err)
          // 如果返回失败，使用redirectTo替换当前结果页面，然后跳转到答题页面
          wx.redirectTo({
            url: '/pages/answer/answer',
            success: () => {
              console.log('使用redirectTo跳转到答题页面，当前索引:', app.globalData.currentCardIndex)
            },
            fail: (err2) => {
              console.error('redirectTo也失败:', err2)
              feedback.showError('页面跳转失败，请重试')
            }
          })
        }
      })
    } else {
      // 完成所有题目，保存答题记录并生成报告
      console.log('所有题目已完成，准备生成报告')
      this.saveAnswerRecords()
    }
  },

  async saveAnswerRecords() {
    const app = getApp()
    
    feedback.showLoading('正在生成学习报告...')
    
    try {
      const answerResults = app.globalData.answerResults || []
      
      // 验证答题数据完整性
      const validResults = answerResults.filter((result, index) => {
        // 跳过null或undefined的结果
        if (!result) {
          console.warn(`[保存答题记录] 索引 ${index} 的答题结果为空，跳过`)
          return false
        }
        
        // 验证必要字段
        const isValid = result.topicId !== undefined && 
                       result.qacardId !== undefined && 
                       result.userAnswer !== undefined && 
                       result.isCorrect !== undefined && 
                       result.elapsedTime !== undefined
        
        if (!isValid) {
          console.warn(`[保存答题记录] 索引 ${index} 的答题结果数据不完整:`, result)
        }
        
        return isValid
      })
      
      // 如果有效结果数量少于总题数，说明有题目未作答，记录警告
      if (validResults.length < answerResults.length) {
        console.warn(`[保存答题记录] 有 ${answerResults.length - validResults.length} 道题未作答，可能导致统计数据不准确`)
      }
      
      console.log(`[保存答题记录] 准备保存答题记录:`, {
        原始数量: answerResults.length,
        有效数量: validResults.length,
        过滤数量: answerResults.length - validResults.length
      })
      
      if (validResults.length === 0) {
        feedback.hideLoading()
        feedback.showWarning('没有可保存的答题记录')
        console.error('[保存答题记录] 没有有效的答题记录可保存')
        return
      }
      
      // 记录详细数据（仅前3条，避免日志过多）
      validResults.slice(0, 3).forEach((result, index) => {
        console.log(`[保存答题记录] 记录 ${index + 1}:`, {
          topicId: result.topicId,
          qacardId: result.qacardId,
          isCorrect: result.isCorrect,
          elapsedTime: result.elapsedTime
        })
      })
      
      // 保存答题记录
      const saveResult = await request.post('/answer/save', {
        answerData: validResults
      })
      
      console.log('[保存答题记录] 保存成功:', saveResult)
      
      // 跳转到学习报告页面
      feedback.hideLoading()
      const config = require('../../utils/config')
      feedback.showSuccess('答题记录已保存')
      
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/report/report'
        })
      }, config.ui.navigationDelay)
    } catch (err) {
      feedback.hideLoading()
      console.error('[保存答题记录] 保存失败:', {
        error: err.message,
        answerResults: app.globalData.answerResults
      })
      
      feedback.showFormattedError(err, '生成报告失败，请稍后重试')
      
      // 如果是401错误，清除无效token
      if (err.message === '未授权' || err.message.includes('未授权')) {
        app.globalData.token = ''
        wx.removeStorageSync('token')
      }
    }
  }
})