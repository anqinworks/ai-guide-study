require('dotenv').config();

// 注意：此文件已弃用，请使用 config/config.js 中的数据库配置
// 保留此文件仅用于向后兼容，实际配置请使用 config/config.js

const mainConfig = require('./config');

module.exports = {
  development: mainConfig.database.development,
  test: mainConfig.database.test,
  production: mainConfig.database.production
};
