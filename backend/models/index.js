const Sequelize = require('sequelize');
const config = require('../config/config');

// 根据环境获取数据库配置
const env = config.server.env || 'development';
const dbConfig = config.database[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 导入模型
db.User = require('./user')(sequelize, Sequelize);
db.Topic = require('./topic')(sequelize, Sequelize);
db.QACard = require('./qaCard')(sequelize, Sequelize);
db.AnswerRecord = require('./answerRecord')(sequelize, Sequelize);
db.LearningReport = require('./learningReport')(sequelize, Sequelize);
db.LearningGoal = require('./LearningGoal')(sequelize, Sequelize);

// 定义关联关系
db.User.hasMany(db.Topic, { foreignKey: 'userId' });
db.Topic.belongsTo(db.User, { foreignKey: 'userId' });

db.Topic.hasMany(db.QACard, { foreignKey: 'topicId' });
db.QACard.belongsTo(db.Topic, { foreignKey: 'topicId' });

db.User.hasMany(db.AnswerRecord, { foreignKey: 'userId' });
db.AnswerRecord.belongsTo(db.User, { foreignKey: 'userId' });

db.QACard.hasMany(db.AnswerRecord, { foreignKey: 'qacardId' });
db.AnswerRecord.belongsTo(db.QACard, { foreignKey: 'qacardId' });

db.Topic.hasMany(db.AnswerRecord, { foreignKey: 'topicId' });
db.AnswerRecord.belongsTo(db.Topic, { foreignKey: 'topicId' });

db.User.hasMany(db.LearningReport, { foreignKey: 'userId' });
db.LearningReport.belongsTo(db.User, { foreignKey: 'userId' });

db.Topic.hasMany(db.LearningReport, { foreignKey: 'topicId' });
db.LearningReport.belongsTo(db.Topic, { foreignKey: 'topicId' });

db.User.hasMany(db.LearningGoal, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.LearningGoal.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
