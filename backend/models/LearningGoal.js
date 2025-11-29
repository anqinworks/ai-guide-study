module.exports = (sequelize, Sequelize) => {
  const LearningGoal = sequelize.define('LearningGoal', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '用户ID'
    },
    name: {
      type: Sequelize.STRING(200),
      allowNull: false,
      comment: '学习目标名称'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '学习目标描述'
    },
    progress: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: '完成进度（0-100）'
    },
    targetDate: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '目标完成日期'
    },
    status: {
      type: Sequelize.ENUM('active', 'completed', 'paused'),
      allowNull: false,
      defaultValue: 'active',
      comment: '目标状态：active-进行中, completed-已完成, paused-已暂停'
    },
    priority: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 5
      },
      comment: '优先级（1-5，5为最高）'
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      onUpdate: Sequelize.NOW
    }
  }, {
    tableName: 'learning_goals',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      }
    ]
  });

  return LearningGoal;
};

