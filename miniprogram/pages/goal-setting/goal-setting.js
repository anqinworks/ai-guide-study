// pages/goal-setting/goal-setting.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')

Page({
  data: {
    goals: [],
    showForm: false,
    editingGoal: null,
    saving: false,
    nameInputFocused: false,
    isDraggingProgress: false,
    progressBarWidth: 0,
    progressBarLeft: 0,
    formData: {
      name: '',
      description: '',
      targetDate: '',
      priority: 1,
      progress: 0,
      status: 'active'
    },
    statusOptions: [
      { value: 'active', label: '进行中', icon: '▶️' },
      { value: 'completed', label: '已完成', icon: '✅' },
      { value: 'paused', label: '已暂停', icon: '⏸️' }
    ],
    minDate: ''
  },

  onLoad() {
    this.setMinDate()
    this.loadGoals()
  },

  onShow() {
    // 每次显示页面时重新加载目标列表
    this.loadGoals()
  },

  // 设置最小日期（今天）
  setMinDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    this.setData({
      minDate: `${year}-${month}-${day}`
    })
  },

  // 加载学习目标列表
  async loadGoals() {
    try {
      feedback.showLoading('加载中...')
      const res = await request.get('/learning-goal')
      
      if (res.success) {
        // 格式化日期显示
        const goals = res.goals.map(goal => ({
          ...goal,
          targetDate: goal.targetDate ? this.formatDate(goal.targetDate) : null
        }))
        
        this.setData({ goals })
      } else {
        feedback.showError(res.message || '加载学习目标失败')
      }
    } catch (err) {
      console.error('加载学习目标失败', err)
      feedback.showFormattedError(err, '加载学习目标失败，请稍后重试')
    } finally {
      feedback.hideLoading()
    }
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 显示添加表单
  showAddForm() {
    this.setData({
      showForm: true,
      editingGoal: null,
      formData: {
        name: '',
        description: '',
        targetDate: '',
        priority: 1,
        progress: 0,
        status: 'active'
      }
    })
  },

  // 编辑目标
  editGoal(e) {
    const goal = e.currentTarget.dataset.goal
    this.setData({
      showForm: true,
      editingGoal: goal,
      formData: {
        name: goal.name,
        description: goal.description || '',
        targetDate: goal.targetDate || '',
        priority: goal.priority,
        progress: goal.progress,
        status: goal.status
      }
    })
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      showForm: false,
      editingGoal: null,
      formData: {
        name: '',
        description: '',
        targetDate: '',
        priority: 1,
        progress: 0,
        status: 'active'
      }
    })
  },

  // 输入处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onNameFocus(e) {
    // 输入框获得焦点时的处理
    this.setData({
      nameInputFocused: true
    })
  },

  onNameBlur(e) {
    // 输入框失去焦点时的处理
    this.setData({
      nameInputFocused: false
    })
  },

  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  onDateChange(e) {
    this.setData({
      'formData.targetDate': e.detail.value
    })
  },

  // 进度条触摸开始
  onProgressTouchStart(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    this.setData({
      isDraggingProgress: true
    })
    // 延迟执行以确保DOM已渲染
    setTimeout(() => {
      this.updateProgressFromTouch(e)
    }, 10)
  },

  // 进度条触摸移动
  onProgressTouchMove(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    this.updateProgressFromTouch(e)
  },

  // 进度条触摸结束
  onProgressTouchEnd(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    this.updateProgressFromTouch(e)
    setTimeout(() => {
      this.setData({
        isDraggingProgress: false
      })
    }, 300)
  },

  // 根据触摸位置更新进度
  updateProgressFromTouch(e) {
    if (!e) return
    
    const query = wx.createSelectorQuery().in(this)
    query.select('.progress-bar-track').boundingClientRect((rect) => {
      if (!rect || !rect.width) {
        console.warn('进度条元素未找到或宽度为0')
        return
      }
      
      // 获取触摸点信息
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
      if (!touch) {
        console.warn('未获取到触摸点信息')
        return
      }
      
      // 获取触摸点的X坐标（优先使用clientX，兼容不同环境）
      const clientX = touch.clientX || touch.pageX || 0
      if (!clientX) {
        console.warn('无法获取触摸点X坐标')
        return
      }
      
      const left = rect.left
      const width = rect.width
      
      // 计算进度百分比
      let progress = ((clientX - left) / width) * 100
      progress = Math.max(0, Math.min(100, Math.round(progress)))
      
      // 更新进度值
      this.setData({
        'formData.progress': progress
      })
      
      console.log('[进度拖动]', {
        clientX,
        left,
        width,
        progress
      })
    }).exec()
  },

  onProgressChange(e) {
    const progress = parseInt(e.detail.value) || 0
    this.setData({
      'formData.progress': progress
    })
  },

  onProgressChanging(e) {
    // 滑块拖动时的实时更新（保留作为备用）
    const progress = parseInt(e.detail.value) || 0
    this.setData({
      'formData.progress': progress
    })
  },

  selectPriority(e) {
    const priority = e.currentTarget.dataset.priority
    this.setData({
      'formData.priority': priority
    })
  },

  selectStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      'formData.status': status
    })
  },

  // 保存学习目标
  async saveGoal() {
    // 数据验证
    if (!this.data.formData.name || !this.data.formData.name.trim()) {
      feedback.showWarning('请输入学习目标名称')
      return
    }

    if (this.data.formData.name.length > 200) {
      feedback.showWarning('目标名称不能超过200个字符')
      return
    }

    if (this.data.formData.description && this.data.formData.description.length > 500) {
      feedback.showWarning('目标描述不能超过500个字符')
      return
    }

    this.setData({ saving: true })

    try {
      const formData = {
        name: this.data.formData.name.trim(),
        description: this.data.formData.description.trim() || null,
        targetDate: this.data.formData.targetDate || null,
        priority: this.data.formData.priority
      }

      if (this.data.editingGoal) {
        // 更新现有目标
        formData.progress = this.data.formData.progress
        formData.status = this.data.formData.status

        const res = await request.put(`/learning-goal/${this.data.editingGoal.id}`, formData)
        
        if (res.success) {
          feedback.showSuccess('学习目标更新成功')
          this.cancelEdit()
          this.loadGoals()
          
          // 通知"我的页面"刷新学习目标列表
          this.notifyUserPageRefresh()
        } else {
          feedback.showError(res.message || '更新学习目标失败')
        }
      } else {
        // 创建新目标
        const res = await request.post('/learning-goal', formData)
        
        if (res.success) {
          feedback.showSuccess('学习目标创建成功')
          this.cancelEdit()
          this.loadGoals()
          
          // 通知"我的页面"刷新学习目标列表
          this.notifyUserPageRefresh()
        } else {
          feedback.showError(res.message || '创建学习目标失败')
        }
      }
    } catch (err) {
      console.error('保存学习目标失败', err)
      feedback.showFormattedError(err, '保存学习目标失败，请稍后重试')
    } finally {
      this.setData({ saving: false })
    }
  },

  // 删除学习目标
  deleteGoal(e) {
    const goalId = e.currentTarget.dataset.id
    const goalName = e.currentTarget.dataset.name

    wx.showModal({
      title: '确认删除',
      content: `确定要删除学习目标"${goalName}"吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            feedback.showLoading('删除中...')
            const result = await request.delete(`/learning-goal/${goalId}`)
            
            if (result.success) {
              feedback.showSuccess('学习目标已删除')
              this.loadGoals()
              
              // 通知"我的页面"刷新学习目标列表
              this.notifyUserPageRefresh()
            } else {
              feedback.showError(result.message || '删除学习目标失败')
            }
          } catch (err) {
            console.error('删除学习目标失败', err)
            feedback.showFormattedError(err, '删除学习目标失败，请稍后重试')
          } finally {
            feedback.hideLoading()
          }
        }
      }
    })
  },

  // 通知"我的页面"刷新学习目标列表
  notifyUserPageRefresh() {
    try {
      // 获取页面栈
      const pages = getCurrentPages()
      // 查找"我的页面"
      const userPage = pages.find(page => page.route === 'pages/user/user')
      if (userPage) {
        // 调用"我的页面"的刷新方法
        if (typeof userPage.loadLearningGoals === 'function') {
          userPage.loadLearningGoals()
        }
        // 同时刷新学习统计数据，确保数据同步
        if (typeof userPage.loadLearningStats === 'function') {
          userPage.loadLearningStats()
        }
      }
    } catch (err) {
      console.warn('通知用户页面刷新失败', err)
    }
  }
})

