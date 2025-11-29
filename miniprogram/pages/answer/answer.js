// pages/answer/answer.js
const feedback = require('../../utils/feedback')

Page({
  data: {
    currentIndex: 0,
    totalCount: 0,
    currentCard: {},
    selectedAnswer: '',
    startTime: 0
  },

  onLoad(options) {
    const app = getApp()
    this.loadQuestionData()
  },

  onShow() {
    // 当页面显示时，检查索引是否变化（比如从结果页面返回）
    // 如果索引变化了，重新加载题目数据
    const app = getApp()
    const newIndex = app.globalData.currentCardIndex || 0
    
    // 如果索引变化了，重新加载数据
    if (this.data.currentIndex !== newIndex) {
      console.log('检测到索引变化，从', this.data.currentIndex, '变为', newIndex)
      this.loadQuestionData()
    }
  },

  loadQuestionData() {
    const app = getApp()
    const currentIndex = app.globalData.currentCardIndex || 0
    const qaCards = app.globalData.qaCards || []
    
    // 确保索引在有效范围内
    if (currentIndex >= 0 && currentIndex < qaCards.length) {
      this.setData({
        currentIndex: currentIndex,
        totalCount: qaCards.length,
        currentCard: qaCards[currentIndex],
        selectedAnswer: '', // 重置选择
        startTime: Date.now() // 重新开始计时
      })
      console.log('加载题目数据，索引:', currentIndex, '总题数:', qaCards.length)
    } else {
      console.error('索引超出范围:', currentIndex, '卡片数量:', qaCards.length)
      // 如果索引无效，跳转回首页或提示错误
      feedback.showError('题目加载失败，请重新开始')
      setTimeout(() => {
        wx.navigateBack({
          delta: 999 // 返回首页
        })
      }, 1500)
    }
  },

  selectOption(e) {
    const option = e.currentTarget.dataset.option
    console.log('选择了选项:', option)
    // 确保option不是undefined或null，避免设置无效值
    if (option) {
      this.setData({
        selectedAnswer: option
      })
    }
  },

  submitAnswer() {
    const app = getApp()
    const currentCard = app.globalData.qaCards[this.data.currentIndex]
    const selectedAnswer = this.data.selectedAnswer
    const correctAnswer = currentCard.correctAnswer
    
    console.log('[提交答案] 开始提交:', {
      题目索引: this.data.currentIndex,
      题目ID: currentCard.id,
      选择答案: selectedAnswer,
      正确答案: correctAnswer
    })
    
    // 验证必要数据
    if (!currentCard) {
      console.error('[提交答案] 当前卡片不存在')
      feedback.showError('题目数据异常，请重新加载')
      return
    }
    
    if (!selectedAnswer) {
      console.warn('[提交答案] 未选择答案')
      feedback.showWarning('请先选择一个答案')
      return
    }
    
    // 确保correctAnswer不是空值，避免比较失败
    let isCorrect = false
    if (!correctAnswer) {
      console.warn('[提交答案] 正确答案为空，使用默认逻辑处理')
      // 如果correctAnswer为空，尝试从选项中找出正确答案
      // 对于AI生成的卡片，正确答案应该是选项中的第一个
      isCorrect = selectedAnswer === (currentCard.options && currentCard.options[0])
    } else {
      // 提取选项字母进行比较，处理格式不一致问题
      // 例如：从"A. int"中提取"A"，从"A"中提取"A"
      const extractOptionLetter = (answer) => {
        if (typeof answer === 'string') {
          // 提取第一个字符作为选项字母
          const match = answer.match(/^([A-Da-d])/)
          return match ? match[1].toUpperCase() : answer
        }
        return answer
      }
      
      const selectedLetter = extractOptionLetter(selectedAnswer)
      const correctLetter = extractOptionLetter(correctAnswer)
      
      isCorrect = selectedLetter === correctLetter
      
      console.log('[提交答案] 答案比较:', {
        提取的选择字母: selectedLetter,
        提取的正确字母: correctLetter,
        是否正确: isCorrect
      })
    }

    // 计算答题耗时（毫秒）
    const elapsedTime = Date.now() - this.data.startTime;
    
    // 保存答题结果 - 使用当前索引确保答案存储在正确位置
    const answerResult = {
      topicId: currentCard.topicId,
      qacardId: currentCard.id,
      userAnswer: String(selectedAnswer || ''), // 确保是字符串
      isCorrect: Boolean(isCorrect), // 确保是布尔值
      elapsedTime: Math.max(0, Math.floor(elapsedTime)) // 确保是非负整数（毫秒）
    }
    
    // 验证保存的数据完整性
    if (!answerResult.topicId || !answerResult.qacardId) {
      console.error('[提交答案] 答题结果数据不完整:', answerResult)
      feedback.showError('保存答案失败，请重试')
      return
    }
    
    app.globalData.answerResults[this.data.currentIndex] = answerResult
    
    console.log('[提交答案] 答题结果已保存:', {
      索引: this.data.currentIndex,
      题目ID: answerResult.qacardId,
      是否正确: answerResult.isCorrect,
      耗时: `${answerResult.elapsedTime}ms`,
      总记录数: app.globalData.answerResults.filter(r => r !== null && r !== undefined).length
    })

    // 跳转到结果页面
    wx.navigateTo({
      url: '/pages/result/result?correct=' + isCorrect
    })
  }
})
