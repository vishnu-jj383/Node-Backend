const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Order = require("../order/order");
const Cad = require("../cad/cad");
const Sketch = require("../sketches/sketches");
const Render = require("../render/render");

const Design = sequelize.define(
  "Design",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    designNo: {
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
    renderId: {
      type: DataTypes.INTEGER,
      references: {
        model: Render,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    /* status: {
      type: DataTypes.ENUM("Pending", "Initiated", "Approved", "Rejected"),
      defaultValue: "Pending",
    }, */
    DesignStatus: {
      type: DataTypes.ENUM("design"),
      defaultValue: "design",
    },
    type: {
      type: DataTypes.ENUM("dew","others"),
    },
    imageUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "Stores an array of image URLs",
    },
    isManufactured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
 
  {
    tableName: "Design",
    timestamps: true,
  }
);

Design.beforeValidate(async (design) => {
  const lastdesign = await Design.findOne({
    order: [["id", "DESC"]],
    attributes: ["designNo"],
  });

  let newIdNumber = 100; // Start from SK100 if no previous designes exist

  if (lastdesign && lastdesign.designNo) {
    const match = lastdesign.designNo.match(/\d+/); // Extract numbers from SKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  design.designNo = `D-${newIdNumber}`;
});

// Establishing relationships
Design.belongsTo(Order, { foreignKey: "orderId" });
Design.belongsTo(Cad, { foreignKey: "cadId" });
Design.belongsTo(Sketch, { foreignKey: "sketchId" });
Design.belongsTo(Render, { foreignKey: "sketchId" });

Order.hasOne(Design, { foreignKey: "orderId" });
Cad.hasOne(Design, { foreignKey: "cadId" });
Sketch.hasOne(Design, { foreignKey: "sketchId" });
Render.hasOne(Design, { foreignKey: "renderId" });

module.exports = Design;
