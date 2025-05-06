const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Sketch = require("../sketches/sketches");
const Order = require("../order/order");

const Cad = sequelize.define("Cad", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  cadNo: {
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
  reqCadCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  selectedCadCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  promiseDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cadBriefDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cadCompletedDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  specialInstruction: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  imageUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: "Stores an array of image URLs",
  },
  status: {
    type: DataTypes.ENUM("Pending", "Initiated", "Approved", "Rejected"),
    defaultValue: "Pending",
  },
  cadStatus: {
    type: DataTypes.ENUM("cad","render","design"),
    defaultValue: "cad",
  },
  reason:{
    type: DataTypes.STRING,
  }
});

// **Auto-generate cadId (CAD100, CAD101, ...)**
Cad.beforeValidate(async (cad) => {
  const lastCad = await Cad.findOne({
    order: [["cadNo", "DESC"]],
  });

  let newId = "CAD100"; // Default if no records exist
  if (lastCad && lastCad.cadNo) {
    const lastNumber = parseInt(lastCad.cadNo.replace("CAD", ""), 10);
    newId = `CAD${lastNumber + 1}`;
  }
  cad.cadNo = newId;
});

Cad.belongsTo(Order, { foreignKey: "orderId" });
Order.hasOne(Cad, { foreignKey: "orderId" });

Cad.belongsTo(Sketch, { foreignKey: "sketchId" });
Sketch.hasMany(Cad, { foreignKey: "sketchId" });

module.exports = Cad;
