// pages/index/index.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')

Page({
  data: {
    topic: '',
    recommendTopics: []
  },

  onLoad() {
    this.getRecommendTopics()
  },

  onTopicInput(e) {
    this.setData({
      topic: e.detail.value
    })
  },

  goToTopicSetting() {
    if (!this.data.topic || this.data.topic.trim() === '') {
      feedback.showWarning('请输入学习主题')
      return
    }
    
    const app = getApp()
    app.globalData.currentTopic = this.data.topic
    
    wx.navigateTo({
      url: '/pages/topic-setting/topic-setting'
    })
  },

  selectTopic(e) {
    const topic = e.currentTarget.dataset.topic
    this.setData({
      topic
    })
  },

  async getRecommendTopics() {
    try {
      const res = await request.get('/topic/recommend')
      this.setData({
        recommendTopics: res.topics
      })
    } catch (err) {
      console.error('获取推荐主题失败', err)
    }
  },


})