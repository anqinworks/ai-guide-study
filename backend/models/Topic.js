module.exports = (sequelize, Sequelize) => {
  const Topic = sequelize.define('Topic', {
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
    topic: {
      type: Sequelize.STRING,
      allowNull: false
    },
    difficulty: {
      type: Sequelize.STRING,
      allowNull: false
    },
    cardCount: {
      type: Sequelize.INTEGER,
      allowNull: false
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
    tableName: 'topics',
    timestamps: true
  });

  return Topic;
};
