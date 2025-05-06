  const { DataTypes } = require("sequelize");
  const { sequelize } = require("../../configuration/db");
  const Order = require("../order/order");
  const Sketch = require("../sketches/sketches");
  const User = require("../auth/userModel");
  const Cad = require("../cad/cad");
  const Render = require("../render/render");

  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      taskId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.INTEGER,
        references: {
          model: Order,
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      sketchId: {
        type: DataTypes.INTEGER,
        references: {
          model: Sketch,
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cadId: {
        type: DataTypes.INTEGER,
        references: {
          model: Cad,
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      renderId: {
        type: DataTypes.INTEGER,
        references: {
          model: Render,
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      empId: {
        type: DataTypes.INTEGER,
        references: {
          model: User,
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      startDate: {
        type: DataTypes.DATE,
      },
      endDate: {
        type: DataTypes.DATE,
      },
      completedDate: {
        type: DataTypes.DATE,
      },
    selectedCount: {
      type: DataTypes.INTEGER,
      },
      type: {
        type: DataTypes.ENUM("sketch", "cad","render"),
      },
      imageUrls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Stores an array of image URLs",
      },
      selectedImageUrlsCustomer: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Stores an array of image URLs",
      },
      selectedImageUrlsDew: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Stores an array of image URLs",
      },
      reqCount: {
        type: DataTypes.INTEGER,
      },
      isApprovedCustomer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Indicates whether the task is approved by the customer",
      },
      isApprovedOwn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Indicates whether the task is approved by Dew",
      },
    },
    {
      tableName: "task",
      timestamps: true,
    }
  );

  // Hook to auto-generate taskId with 'TSK-' prefix
  Task.beforeValidate(async (task) => {
    const lastTask = await Task.findOne({
      order: [["id", "DESC"]],
      attributes: ["taskId"],
    });

    let newIdNumber = 100; // Start from TSK100 if no previous tasks exist

    if (lastTask && lastTask.taskId) {
      const match = lastTask.taskId.match(/\d+/); // Extract numbers from TSKxxx
      const lastIdNumber = match ? parseInt(match[0], 10) : 99;
      newIdNumber = lastIdNumber + 1;
    }

    task.taskId = `TSK${newIdNumber}`;
  });

  // Relationships
  Task.belongsTo(User, { foreignKey: "empId" });
  User.hasMany(Task, { foreignKey: "empId" });

  Task.belongsTo(Order, { foreignKey: "orderId" });
  Order.hasMany(Task, { foreignKey: "orderId" });

  Task.belongsTo(Sketch, { foreignKey: "sketchId" });
  Sketch.hasMany(Task, { foreignKey: "sketchId" });

  Task.belongsTo(Cad, { foreignKey: "cadId" });
  Cad.hasMany(Task, { foreignKey: "cadId" });

  Task.belongsTo(Render, { foreignKey: "renderId" });
  Render.hasMany(Task, { foreignKey: "renderId" });

  module.exports = Task;
