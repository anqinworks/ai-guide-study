const { verifyToken } = require('../config/jwt');
const { logAuth } = require('../utils/logger');

/**
 * 不需要记录认证日志的路径列表
 * 这些路径通常是高频调用的接口，避免日志过多
 */
const SILENT_AUTH_PATHS = [
  '/progress/',  // 任务进度查询接口
];

/**
 * 检查路径是否需要静默认证（不记录日志）
 * @param {string} path - 请求路径
 * @returns {boolean} - 是否需要静默认证
 */
function shouldSilentAuth(path) {
  return SILENT_AUTH_PATHS.some(silentPath => path.includes(silentPath));
}

/**
 * 认证中间件 - 验证用户身份并确保数据访问安全
 * 所有需要认证的路由都应该使用此中间件
 * 优化：如果请求已经通过认证（req.user存在），则跳过重复验证
 */
const authenticate = (req, res, next) => {
  const isSilent = shouldSilentAuth(req.path);
  
  try {
    // 检查是否已经认证过（避免重复验证）
    if (req.user && req.user.userId) {
      // 静默路径不记录日志
      if (!isSilent) {
        logAuth(req.user.userId, 'skipped', {
          reason: 'already_authenticated',
          path: req.path,
          method: req.method
        }, false);
      }
      return next();
    }

    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // 静默路径不记录日志，但仍返回错误
      if (!isSilent) {
        logAuth(null, 'failed', {
          reason: 'missing_token',
          path: req.path,
          method: req.method
        }, false);
      }
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证token
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      // 静默路径不记录日志，但仍返回错误
      if (!isSilent) {
        logAuth(null, 'failed', {
          reason: 'invalid_token',
          path: req.path,
          method: req.method
        }, false);
      }
      return res.status(401).json({ message: '无效的token，请重新登录' });
    }
    
    // 将用户信息附加到请求对象，供后续路由使用
    req.user = {
      userId: decoded.userId
    };
    
    // 标记请求已认证，避免后续中间件重复验证
    req._authenticated = true;
    
    // 静默路径不记录成功日志（使用silent参数确保完全不记录）
    if (!isSilent) {
      logAuth(decoded.userId, 'success', {
        path: req.path,
        method: req.method
      }, false);
    }
    
    next();
  } catch (error) {
    // 静默路径不记录异常日志，但仍返回错误
    // 对于静默路径，错误日志也不应包含用户信息
    if (!isSilent) {
      logAuth(null, 'failed', {
        reason: 'exception',
        error: error.message,
        path: req.path,
        method: req.method
      }, false);
    } else {
      // 静默路径只记录错误类型，不包含任何用户信息
      console.error('[认证中间件] 认证过程出错:', {
        path: req.path,
        method: req.method,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return res.status(401).json({ message: '认证失败，请重新登录' });
  }
};

/**
 * 数据所有权验证中间件 - 确保用户只能访问自己的数据
 * 用于验证用户是否有权限访问特定的资源（如Topic、QACard等）
 */
const verifyOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam] || req.query[resourceIdParam];
      const userId = req.user?.userId;
      
      if (!resourceId) {
        return res.status(400).json({ message: '缺少资源ID参数' });
      }
      
      if (!userId) {
        return res.status(401).json({ message: '未授权' });
      }
      
      // 查询资源并验证所有权
      const resource = await resourceModel.findOne({
        where: { id: resourceId }
      });
      
      if (!resource) {
        return res.status(404).json({ message: '资源不存在' });
      }
      
      // 检查资源是否属于当前用户
      // 对于Topic，直接检查userId
      // 对于QACard，需要通过Topic检查userId
      let ownerId = null;
      
      if (resource.userId) {
        // Topic等直接有userId的资源
        ownerId = resource.userId;
      } else if (resource.topicId) {
        // QACard等需要通过关联查询的资源
        const topic = await resourceModel.sequelize.models.Topic.findOne({
          where: { id: resource.topicId }
        });
        if (topic) {
          ownerId = topic.userId;
        }
      }
      
      if (ownerId !== userId) {
        console.warn(`[数据所有权验证] 用户 ${userId} 尝试访问不属于自己的资源 ${resourceId}`);
        return res.status(403).json({ message: '无权访问此资源' });
      }
      
      // 将资源附加到请求对象
      req.resource = resource;
      next();
    } catch (error) {
      console.error('[数据所有权验证] 验证过程出错:', error);
      return res.status(500).json({ message: '验证资源所有权失败' });
    }
  };
};

module.exports = {
  authenticate,
  verifyOwnership
};

