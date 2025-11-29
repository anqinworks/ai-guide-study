const express = require('express');
const router = express.Router();
const db = require('../models');
const { generateToken, verifyToken } = require('../config/jwt');
const axios = require('axios');
const config = require('../config/config');

// 微信登录 - 兼容旧版
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    
    // 调用微信官方API获取openid
    let openid;
    try {
      console.log('微信登录参数:', {
        appid: config.wechat.appid,
        secret: '******', // 隐藏secret，避免泄露
        code: code,
        grant_type: 'authorization_code'
      });
      
      const response = await axios.get(config.wechat.loginUrl, {
        params: {
          appid: config.wechat.appid,
          secret: config.wechat.secret,
          js_code: code,
          grant_type: 'authorization_code'
        },
        timeout: 10000 // 设置10秒超时
      });
      
      console.log('微信API响应:', response.data);
      
      // 检查微信API返回的错误
      if (response.data.errcode) {
        console.error('微信登录失败:', response.data);
        
        // 针对不同错误码提供更详细的错误信息
        let errorMsg = '微信登录失败';
        switch (response.data.errcode) {
          case 40029:
            errorMsg = '微信登录失败：无效的code，请重试';
            break;
          case 45011:
            errorMsg = '微信登录失败：请求频率过高，请稍后重试';
            break;
          case 40226:
            errorMsg = '微信登录失败：code已被使用';
            break;
          default:
            errorMsg = '微信登录失败：' + response.data.errmsg;
        }
        
        throw new Error(errorMsg);
      } else {
        openid = response.data.openid;
      }
    } catch (wechatError) {
      console.error('微信API调用失败:', wechatError);
      
      // 区分不同类型的错误
      if (wechatError.code === 'ECONNABORTED') {
        throw new Error('微信登录失败：网络请求超时，请检查网络连接');
      } else if (wechatError.response) {
        // 服务器返回了错误响应
        throw new Error('微信登录失败：服务器错误，请稍后重试');
      } else if (wechatError.request) {
        // 请求已发出，但没有收到响应
        throw new Error('微信登录失败：网络连接失败，请检查网络');
      } else {
        // 其他错误
        throw new Error('微信登录失败，请检查网络连接或稍后重试');
      }
    }
    
    // 查找或创建用户
    let user = await db.User.findOne({ where: { openid } });
    
    if (!user) {
      user = await db.User.create({
        openid,
        nickname: `用户${Date.now().toString().slice(-6)}`,
        avatar: ''
      });
    }
    
    // 生成token
    const token = generateToken(user.id);
    
    res.status(200).json({
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 微信登录 - 前端调用的端点
router.post('/wx-login', async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    // 调用微信官方API获取openid
    let openid;
    try {
      console.log('微信登录参数:', {
        appid: config.wechat.appid,
        secret: '******', // 隐藏secret，避免泄露
        code: code,
        grant_type: 'authorization_code'
      });
      
      const response = await axios.get(config.wechat.loginUrl, {
        params: {
          appid: config.wechat.appid,
          secret: config.wechat.secret,
          js_code: code,
          grant_type: 'authorization_code'
        },
        timeout: 10000 // 设置10秒超时
      });
      
      console.log('微信API响应:', response.data);
      
      // 检查微信API返回的错误
      if (response.data.errcode) {
        console.error('微信登录失败:', response.data);
        
        // 针对不同错误码提供更详细的错误信息
        let errorMsg = '微信登录失败';
        switch (response.data.errcode) {
          case 40029:
            errorMsg = '微信登录失败：无效的code，请重试';
            break;
          case 45011:
            errorMsg = '微信登录失败：请求频率过高，请稍后重试';
            break;
          case 40226:
            errorMsg = '微信登录失败：code已被使用';
            break;
          default:
            errorMsg = '微信登录失败：' + response.data.errmsg;
        }
        
        throw new Error(errorMsg);
      } else {
        openid = response.data.openid;
      }
    } catch (wechatError) {
      console.error('微信API调用失败:', wechatError);
      
      // 区分不同类型的错误
      if (wechatError.code === 'ECONNABORTED') {
        throw new Error('微信登录失败：网络请求超时，请检查网络连接');
      } else if (wechatError.response) {
        // 服务器返回了错误响应
        throw new Error('微信登录失败：服务器错误，请稍后重试');
      } else if (wechatError.request) {
        // 请求已发出，但没有收到响应
        throw new Error('微信登录失败：网络连接失败，请检查网络');
      } else {
        // 其他错误
        throw new Error('微信登录失败，请检查网络连接或稍后重试');
      }
    }
    
    // 查找或创建用户
    let user = await db.User.findOne({ where: { openid } });
    
    if (!user) {
      user = await db.User.create({
        openid,
        nickname: userInfo?.nickName || `用户${Date.now().toString().slice(-6)}`,
        avatar: userInfo?.avatarUrl || ''
      });
    } else {
      // 更新用户信息
      await user.update({
        nickname: userInfo?.nickName || user.nickname,
        avatar: userInfo?.avatarUrl || user.avatar
      });
    }
    
    // 生成token
    const token = generateToken(user.id);
    
    res.status(200).json({
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('WX Login error:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 获取用户信息
router.get('/info', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    // 验证token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: '无效的token' });
    }
    
    // 获取用户信息
    const user = await db.User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 简单测试端点
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint works!' });
});

// 验证token有效性 - 用于小程序启动时检查登录状态
router.get('/validate', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    // 验证token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: '无效的token' });
    }
    
    // 获取用户信息
    const user = await db.User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ message: '验证token失败' });
  }
});

module.exports = router;
