const Sequelize = require('sequelize');
const config = require('../config/database.js');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  port: config.development.port,
  dialect: config.development.dialect,
  logging: config.development.logging
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

module.exports = db;
