/**
 * 任务管理器 - 用于跟踪长时间运行的任务进度
 * 在生产环境中，应该使用Redis等持久化存储
 */

class TaskManager {
  constructor() {
    // 任务存储：taskId -> { status, progress, message, result, error, createdAt }
    this.tasks = new Map();
    
    // 定期清理已完成的任务（5分钟后）
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 创建新任务
   * @param {string} taskId - 任务ID
   * @param {object} initialData - 初始任务数据
   */
  createTask(taskId, initialData = {}) {
    this.tasks.set(taskId, {
      status: 'pending', // pending, processing, completed, failed
      progress: 0, // 0-100
      message: '任务已创建',
      result: null,
      error: null,
      createdAt: new Date(),
      ...initialData
    });
    
    console.log(`[任务管理器] 创建任务: ${taskId}`);
    return this.tasks.get(taskId);
  }

  /**
   * 更新任务进度
   * @param {string} taskId - 任务ID
   * @param {number} progress - 进度 0-100
   * @param {string} message - 进度消息
   */
  updateProgress(taskId, progress, message = '') {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[任务管理器] 任务不存在: ${taskId}`);
      return false;
    }
    
    task.progress = Math.min(100, Math.max(0, progress));
    task.message = message || task.message;
    task.status = task.progress < 100 ? 'processing' : 'completed';
    
    console.log(`[任务管理器] 任务 ${taskId} 进度更新: ${progress}% - ${message}`);
    return true;
  }

  /**
   * 完成任务
   * @param {string} taskId - 任务ID
   * @param {object} result - 任务结果
   */
  completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[任务管理器] 任务不存在: ${taskId}`);
      return false;
    }
    
    task.status = 'completed';
    task.progress = 100;
    task.result = result;
    task.message = '任务完成';
    
    console.log(`[任务管理器] 任务 ${taskId} 已完成`);
    return true;
  }

  /**
   * 标记任务失败
   * @param {string} taskId - 任务ID
   * @param {string} error - 错误信息
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[任务管理器] 任务不存在: ${taskId}`);
      return false;
    }
    
    task.status = 'failed';
    task.error = error;
    task.message = `任务失败: ${error}`;
    
    console.error(`[任务管理器] 任务 ${taskId} 失败: ${error}`);
    return true;
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * 清理已完成或失败的任务（超过5分钟）
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分钟
    
    for (const [taskId, task] of this.tasks.entries()) {
      const age = now - task.createdAt.getTime();
      if (age > maxAge && (task.status === 'completed' || task.status === 'failed')) {
        this.tasks.delete(taskId);
        console.log(`[任务管理器] 清理任务: ${taskId}`);
      }
    }
  }

  /**
   * 销毁任务管理器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.tasks.clear();
  }
}

// 创建单例
const taskManager = new TaskManager();

module.exports = taskManager;

