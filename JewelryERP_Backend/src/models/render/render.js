const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Order = require("../../models/order/order");
const Cad = require("../../models/cad/cad");
const Sketch = require("../../models/sketches/sketches");

const Render = sequelize.define(
  "Render",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
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
    renderNo: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
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
    sketchId: {
      type: DataTypes.INTEGER,
      references: {
        model: Sketch,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    status: {
      type: DataTypes.ENUM("Pending", "Initiated", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    renderStatus: {
      type: DataTypes.ENUM("render", "design"),
      defaultValue: "render",
    },
    renderBriefDate: {
      type: DataTypes.DATE,
    },
    renderCompletedDate: {
      type: DataTypes.DATE,
    },
    reqRenderCount: {
      type: DataTypes.INTEGER,
    },
    specialInstructions: {
      type: DataTypes.TEXT,
    },
    reason: {
      type: DataTypes.STRING,
    },
    imageUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "Stores an array of image URLs",
    },
  },
  {
    tableName: "Render",
    timestamps: true,
  }
);

Render.beforeValidate(async (render) => {
  const lastrender = await Render.findOne({
    order: [["id", "DESC"]],
    attributes: ["renderNo"],
  });

  let newIdNumber = 100; // Start from SK100 if no previous renderes exist

  if (lastrender && lastrender.renderNo) {
    const match = lastrender.renderNo.match(/\d+/); // Extract numbers from SKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  render.renderNo = `R-${newIdNumber}`;
});

// Establishing relationships
Render.belongsTo(Order, { foreignKey: "orderId" });
Render.belongsTo(Cad, { foreignKey: "cadId" });
Render.belongsTo(Sketch, { foreignKey: "sketchId" });

Order.hasOne(Render, { foreignKey: "orderId" });
Cad.hasOne(Render, { foreignKey: "cadId" });
Sketch.hasOne(Render, { foreignKey: "sketchId" });

module.exports = Render;
