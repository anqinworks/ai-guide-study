// pages/goal-setting/goal-setting.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')

Page({
  data: {
    goals: [],
    showForm: false,
    editingGoal: null,
    saving: false,
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

  onProgressChange(e) {
    this.setData({
      'formData.progress': e.detail.value
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
  }
})

