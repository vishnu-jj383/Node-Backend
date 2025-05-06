const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Order = require("../../models/order/order");

const Sketch = sequelize.define("Sketch", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  sketchNo: {
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
  status: {
    type: DataTypes.ENUM("Pending", "Initiated", "Approved", "Rejected"),
    defaultValue: "Pending",
  },
  sketchStatus: {
    type: DataTypes.ENUM("sketch", "cad","render","design"),
    defaultValue: "sketch",
  },
  sketchBriefDate: {
    type: DataTypes.DATE,
  },
  sketchCompletedDate: {
    type: DataTypes.DATE,
  },
  promiseDate: {
    type: DataTypes.DATE,
  },
  reqSketchCount: {
    type: DataTypes.INTEGER,
  },
  selectedSketchCount: {
    type: DataTypes.INTEGER,
  },
  specialInstructions: {
    type: DataTypes.TEXT,
  },
  imageUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: "Stores an array of image URLs",
  },
  reason:{
    type: DataTypes.STRING,
  }
},
{
    tableName: "Sketch",
    timestamps: true,
  }
);

// Hook for auto-generating sketchNo with 'SK-' prefix
Sketch.beforeValidate(async (sketch) => {
  const lastSketch = await Sketch.findOne({
    order: [["id", "DESC"]],
    attributes: ["sketchNo"],
  });

  let newIdNumber = 100; // Start from SK100 if no previous sketches exist

  if (lastSketch && lastSketch.sketchNo) {
    const match = lastSketch.sketchNo.match(/\d+/); // Extract numbers from SKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  sketch.sketchNo = `SK${newIdNumber}`;
});

// Establishing relationships
Sketch.belongsTo(Order, { foreignKey: "orderId" });
Order.hasMany(Sketch, { foreignKey: "orderId" });

module.exports = Sketch;
