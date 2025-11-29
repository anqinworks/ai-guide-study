const { verifyToken } = require('../config/jwt');

/**
 * 认证中间件 - 验证用户身份并确保数据访问安全
 * 所有需要认证的路由都应该使用此中间件
 */
const authenticate = (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('[认证中间件] 缺少token');
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证token
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      console.log('[认证中间件] token无效或缺少userId');
      return res.status(401).json({ message: '无效的token，请重新登录' });
    }
    
    // 将用户信息附加到请求对象，供后续路由使用
    req.user = {
      userId: decoded.userId
    };
    
    console.log(`[认证中间件] 用户 ${decoded.userId} 认证成功`);
    next();
  } catch (error) {
    console.error('[认证中间件] 认证过程出错:', error);
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

