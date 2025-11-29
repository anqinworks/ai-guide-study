module.exports = (sequelize, Sequelize) => {
  const QACard = sequelize.define('QACard', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    topicId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id'
      }
    },
    question: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    options: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false
    },
    correctAnswer: {
      type: Sequelize.STRING,
      allowNull: false
    },
    explanation: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    difficulty: {
      type: Sequelize.STRING,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'qa_cards',
    timestamps: true
  });

  return QACard;
};
