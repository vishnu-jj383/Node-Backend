const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Order = require("../order/order");
const Cad = require("../cad/cad");
const Sketch = require("../sketches/sketches");
const Render = require("../render/render");
const Design = require("../design/design");
const MetalType = require("../materialItems/metalType");
const MetalColor = require("../materialItems/metalColor");
const Customer = require("../customer/customer");

const CustomerDesignUpdate = sequelize.define(
  "CustomerDesignUpdate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    designUpdateNo: {
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
    designId: {
      type: DataTypes.INTEGER,
      references: {
        model: Design,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    customerId: {
      type: DataTypes.INTEGER,
      references: {
        model: Customer,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    /* status: {
      type: DataTypes.ENUM("Pending", "Initiated", "Approved", "Rejected"),
      defaultValue: "Pending",
    }, */
    imageUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metalTypeId: {
      type: DataTypes.INTEGER,
      references: {
        model: MetalType,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    metalColorId: {
      type: DataTypes.INTEGER,
      references: {
        model: MetalColor,
        key: "id",
      },      
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    weight: {
      type: DataTypes.STRING,
      all: true,
    },
    weightChanged: {
      type: DataTypes.BOOLEAN,
      all: true,
    },
    metalTypeChanged: {
      type: DataTypes.BOOLEAN,
      all: true,
    },
    metalColorChanged: {
      type: DataTypes.BOOLEAN,
      all: true,
    },
  },
  {
    tableName: "CustomerDesignUpdate",
    timestamps: true,
  }
);

CustomerDesignUpdate.beforeValidate(async (design) => {
  const lastdesign = await CustomerDesignUpdate.findOne({
    order: [["id", "DESC"]],
    attributes: ["designUpdateNo"],
  });

  let newIdNumber = 100; // Start from SK100 if no previous designes exist

  if (lastdesign && lastdesign.designUpdateNo) {
    const match = lastdesign.designUpdateNo.match(/\d+/); // Extract numbers from SKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  design.designUpdateNo = `D-${newIdNumber}`;
});

// Establishing relationships
CustomerDesignUpdate.belongsTo(Order, { foreignKey: "orderId" });
CustomerDesignUpdate.belongsTo(Cad, { foreignKey: "cadId" });
CustomerDesignUpdate.belongsTo(Sketch, { foreignKey: "sketchId" });
CustomerDesignUpdate.belongsTo(Render, { foreignKey: "sketchId" });
CustomerDesignUpdate.belongsTo(Design, { foreignKey: "designId" });
CustomerDesignUpdate.belongsTo(Customer, { foreignKey: "customerId" });

Order.hasMany(CustomerDesignUpdate, { foreignKey: "orderId" });
Cad.hasMany(CustomerDesignUpdate, { foreignKey: "cadId" });
Sketch.hasMany(CustomerDesignUpdate, { foreignKey: "sketchId" });
Render.hasMany(CustomerDesignUpdate, { foreignKey: "renderId" });
Customer.hasMany(CustomerDesignUpdate, { foreignKey: "customerId" });

CustomerDesignUpdate.belongsTo(MetalType, { foreignKey: "metalTypeId" });
MetalType.hasMany(CustomerDesignUpdate, { foreignKey: "metalTypeId" });
CustomerDesignUpdate.belongsTo(MetalColor, { foreignKey: "metalColorId" });
MetalColor.hasMany(CustomerDesignUpdate, { foreignKey: "metalColorId" });
Design.hasMany(CustomerDesignUpdate, { foreignKey: "designId"});

module.exports = CustomerDesignUpdate;
