module.exports = (sequelize, Sequelize) => {
  const AnswerRecord = sequelize.define('AnswerRecord', {
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
    qacardId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'qa_cards',
        key: 'id'
      }
    },
    userAnswer: {
      type: Sequelize.STRING,
      allowNull: false
    },
    isCorrect: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    answerTime: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    elapsedTime: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'answer_records',
    timestamps: true
  });

  return AnswerRecord;
};
