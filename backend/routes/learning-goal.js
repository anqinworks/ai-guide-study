const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth');

/**
 * 获取用户的所有学习目标
 * GET /api/learning-goal
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const goals = await db.LearningGoal.findAll({
      where: {
        userId: userId
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    
    res.status(200).json({
      success: true,
      goals: goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        description: goal.description,
        progress: goal.progress,
        targetDate: goal.targetDate,
        status: goal.status,
        priority: goal.priority,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }))
    });
  } catch (error) {
    console.error('获取学习目标失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习目标失败',
      error: error.message
    });
  }
});

/**
 * 创建新的学习目标
 * POST /api/learning-goal
 */
router.post('/', authenticate, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const userId = req.user.userId;
    const { name, description, targetDate, priority } = req.body;
    
    // 数据验证
    if (!name || !name.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '学习目标名称不能为空'
      });
    }
    
    if (name.length > 200) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '学习目标名称不能超过200个字符'
      });
    }
    
    if (priority && (priority < 1 || priority > 5)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '优先级必须在1-5之间'
      });
    }
    
    // 检查目标日期是否有效
    let targetDateValue = null;
    if (targetDate) {
      targetDateValue = new Date(targetDate);
      if (isNaN(targetDateValue.getTime())) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '目标日期格式无效'
        });
      }
      // 确保目标日期是未来日期
      if (targetDateValue < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '目标日期不能是过去日期'
        });
      }
    }
    
    // 创建学习目标
    const goal = await db.LearningGoal.create({
      userId: userId,
      name: name.trim(),
      description: description ? description.trim() : null,
      progress: 0,
      targetDate: targetDateValue,
      status: 'active',
      priority: priority || 1
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: '学习目标创建成功',
      goal: {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        progress: goal.progress,
        targetDate: goal.targetDate,
        status: goal.status,
        priority: goal.priority,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建学习目标失败:', error);
    
    // 处理数据库约束错误
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `数据验证失败: ${messages}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: '创建学习目标失败',
      error: error.message
    });
  }
});

/**
 * 更新学习目标
 * PUT /api/learning-goal/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const userId = req.user.userId;
    const goalId = req.params.id;
    const { name, description, progress, targetDate, status, priority } = req.body;
    
    // 查找学习目标
    const goal = await db.LearningGoal.findOne({
      where: {
        id: goalId,
        userId: userId
      },
      transaction
    });
    
    if (!goal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '学习目标不存在'
      });
    }
    
    // 数据验证
    if (name !== undefined) {
      if (!name || !name.trim()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '学习目标名称不能为空'
        });
      }
      if (name.length > 200) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '学习目标名称不能超过200个字符'
        });
      }
      goal.name = name.trim();
    }
    
    if (description !== undefined) {
      goal.description = description ? description.trim() : null;
    }
    
    if (progress !== undefined) {
      const progressValue = parseInt(progress);
      if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '进度必须在0-100之间'
        });
      }
      goal.progress = progressValue;
      
      // 如果进度达到100%，自动设置为已完成
      if (progressValue === 100 && goal.status !== 'completed') {
        goal.status = 'completed';
      }
    }
    
    if (targetDate !== undefined) {
      if (targetDate === null || targetDate === '') {
        goal.targetDate = null;
      } else {
        const targetDateValue = new Date(targetDate);
        if (isNaN(targetDateValue.getTime())) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: '目标日期格式无效'
          });
        }
        goal.targetDate = targetDateValue;
      }
    }
    
    if (status !== undefined) {
      const validStatuses = ['active', 'completed', 'paused'];
      if (!validStatuses.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `状态必须是以下之一: ${validStatuses.join(', ')}`
        });
      }
      goal.status = status;
    }
    
    if (priority !== undefined) {
      const priorityValue = parseInt(priority);
      if (isNaN(priorityValue) || priorityValue < 1 || priorityValue > 5) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '优先级必须在1-5之间'
        });
      }
      goal.priority = priorityValue;
    }
    
    // 保存更新
    await goal.save({ transaction });
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: '学习目标更新成功',
      goal: {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        progress: goal.progress,
        targetDate: goal.targetDate,
        status: goal.status,
        priority: goal.priority,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新学习目标失败:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `数据验证失败: ${messages}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新学习目标失败',
      error: error.message
    });
  }
});

/**
 * 删除学习目标
 * DELETE /api/learning-goal/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const userId = req.user.userId;
    const goalId = req.params.id;
    
    // 查找学习目标
    const goal = await db.LearningGoal.findOne({
      where: {
        id: goalId,
        userId: userId
      },
      transaction
    });
    
    if (!goal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '学习目标不存在'
      });
    }
    
    // 删除学习目标
    await goal.destroy({ transaction });
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: '学习目标删除成功'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('删除学习目标失败:', error);
    res.status(500).json({
      success: false,
      message: '删除学习目标失败',
      error: error.message
    });
  }
});

/**
 * 批量更新学习目标进度
 * PUT /api/learning-goal/batch-update-progress
 */
router.put('/batch-update-progress', authenticate, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const userId = req.user.userId;
    const { updates } = req.body; // [{ id, progress }, ...]
    
    if (!Array.isArray(updates) || updates.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '更新数据格式错误'
      });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { id, progress } = update;
      
      if (!id || progress === undefined) {
        continue;
      }
      
      const progressValue = parseInt(progress);
      if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
        continue;
      }
      
      const goal = await db.LearningGoal.findOne({
        where: {
          id: id,
          userId: userId
        },
        transaction
      });
      
      if (goal) {
        goal.progress = progressValue;
        if (progressValue === 100 && goal.status !== 'completed') {
          goal.status = 'completed';
        }
        await goal.save({ transaction });
        results.push({ id, success: true });
      } else {
        results.push({ id, success: false, message: '目标不存在' });
      }
    }
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: '批量更新完成',
      results: results
    });
  } catch (error) {
    await transaction.rollback();
    console.error('批量更新学习目标进度失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新失败',
      error: error.message
    });
  }
});

module.exports = router;

