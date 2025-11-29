module.exports = (sequelize, Sequelize) => {
  const LearningReport = sequelize.define('LearningReport', {
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
      }
    },
    topicId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id'
      }
    },
    totalQuestions: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    correctAnswers: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    accuracy: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    totalTime: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    wrongQuestions: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false
    },
    learningSuggestions: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'learning_reports',
    timestamps: true
  });

  return LearningReport;
};
