const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Cad = require("../cad/cad");
const Order = require("../order/order");
const ProductType = require("../misc/productTypes");
const MakeType = require("../materialItems/makeType");
const MetalType = require("../materialItems/metalType");
const MetalColor = require("../materialItems/metalColor");
const MaterialType = require("../materialItems/materialType");
const MetalClass = require("../materialItems/metalClass");
const MetalQuality = require("../materialItems/metalQuality");
const DiamondColor = require("../materialItems/diamondColor");
const DiamondSizeGroup = require("../materialItems/diamondSizeGroup");
const DiamondStoneSize = require("../materialItems/diamondStoneSize");
const DiamondQualityGroup = require("../materialItems/diamondQualityGroup");
const DiamondQuality = require("../materialItems/diamondQuality");
const ColorStoneQualityGroup = require("../materialItems/colorStoneQualityGroup");
const ColorStoneQuality = require("../materialItems/colorStoneQuality");
const Shape = require("../materialItems/shapes");
const Sketch = require("../sketches/sketches");
const Sieve = require("../materialItems/sieve");
const ColorStoneColor = require("../materialItems/colorStoneColor");

const AssemblyItem = sequelize.define("AssemblyItems", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  AssemblyNo: {
    type: DataTypes.STRING,
    unique: true,
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
  orderId: {
    type: DataTypes.INTEGER,
    references: {
      model: Order,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  netsuiteId: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  grossWeight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },  
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  carat: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  goldVolume: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  goldGram: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  totalCaratWeight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  pieces: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  productTypeId: {
    type: DataTypes.INTEGER,
    references: {
      model: ProductType,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  numberOfParts: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  makeTypeId: {
    type: DataTypes.INTEGER,
    references: {
      model: MakeType,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  metalTypeId: {
    type: DataTypes.INTEGER,
    references: {
      model: MetalType,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  metalColorId: {
    type: DataTypes.INTEGER,
    references: {
      model: MetalColor,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  materialTypeId: {
    type: DataTypes.INTEGER,
    references: {
      model: MaterialType,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  metalClassId: {
    type: DataTypes.INTEGER,
    references: {
      model: MetalClass,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  metalQualityId: {
    type: DataTypes.INTEGER,
    references: {
      model: MetalQuality,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  DiamondColorId: {
    type: DataTypes.INTEGER,
    references: {
      model: DiamondColor,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  diamondSizegroupId: {
    type: DataTypes.INTEGER,
    references: {
      model: DiamondSizeGroup,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  diamondStoneSizeId: {
    type: DataTypes.INTEGER,
    references: {
      model: DiamondStoneSize,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  sieveId: {
    type: DataTypes.INTEGER,
    references: {
      model: Sieve,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  DiamondQualityGroupId: {
    type: DataTypes.INTEGER,
    references: {
      model: DiamondQualityGroup,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  DiamondQualityId: {
    type: DataTypes.INTEGER,
    references: {
      model: DiamondQuality,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  colorStoneQualityGroupId: {
    type: DataTypes.INTEGER,
    references: {
      model: ColorStoneQualityGroup,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  colorStoneQualityId: {
    type: DataTypes.INTEGER,
    references: {
      model: ColorStoneQuality,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  colorStoneColorId: {
    type: DataTypes.INTEGER,
    references: {
      model: ColorStoneColor,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  shapesId: {
    type: DataTypes.INTEGER,
    references: {
      model: Shape,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
});

AssemblyItem.belongsTo(Cad, {
  foreignKey: "cadId", // The foreign key in the AssemblyItem table
  onDelete: "SET NULL", // If Cad is deleted, set cadId to NULL in AssemblyItem
  onUpdate: "CASCADE",  // If Cad is updated, update cadId in AssemblyItem
});

Cad.hasMany(AssemblyItem, {
  foreignKey: "cadId", // The foreign key in the AssemblyItem table
  onDelete: "SET NULL", // If Cad is deleted, set cadId to NULL in AssemblyItems
  onUpdate: "CASCADE",  // If Cad is updated, update cadId in AssemblyItems
});

AssemblyItem.belongsTo(ProductType, { foreignKey: "productTypeId" });
AssemblyItem.belongsTo(MakeType, { foreignKey: "makeTypeId" });
AssemblyItem.belongsTo(MetalType, { foreignKey: "metalTypeId" });
AssemblyItem.belongsTo(MetalColor, { foreignKey: "metalColorId" });
AssemblyItem.belongsTo(MaterialType, { foreignKey: "materialTypeId" });
AssemblyItem.belongsTo(MetalClass, { foreignKey: "metalClassId" });
AssemblyItem.belongsTo(MetalQuality, { foreignKey: "metalQualityId" });
AssemblyItem.belongsTo(DiamondColor, { foreignKey: "DiamondColorId" });
AssemblyItem.belongsTo(DiamondSizeGroup, { foreignKey: "diamondSizegroupId" });
AssemblyItem.belongsTo(DiamondStoneSize, { foreignKey: "diamondStoneSizeId" });
AssemblyItem.belongsTo(DiamondQualityGroup, { foreignKey: "DiamondQualityGroupId" });
AssemblyItem.belongsTo(DiamondQuality, { foreignKey: "DiamondQualityId" });
AssemblyItem.belongsTo(ColorStoneQualityGroup, { foreignKey: "colorStoneQualityGroupId" });
AssemblyItem.belongsTo(ColorStoneQuality, { foreignKey: "colorStoneQualityId" });
AssemblyItem.belongsTo(ColorStoneColor, { foreignKey: "colorStoneColorId" });
AssemblyItem.belongsTo(Sieve, { foreignKey: "sieveId" });
AssemblyItem.belongsTo(Shape, { foreignKey: "shapesId" });
AssemblyItem.belongsTo(Order, { foreignKey: "orderId" });
Order.hasMany(AssemblyItem, { foreignKey: "orderId" });

// **Auto-generate ID (A-100, A-101, ...)**
AssemblyItem.beforeValidate(async (item) => {
  const lastItem = await AssemblyItem.findOne({
    order: [["AssemblyNo", "DESC"]],
  });

  let newId = "A-100"; // Default if no records exist
  if (lastItem && lastItem.AssemblyNo) {
    const lastNumber = parseInt(lastItem.AssemblyNo.replace("A-", ""), 10);
    newId = `A-${lastNumber + 1}`;
  }
  item.AssemblyNo = newId;
});

module.exports = AssemblyItem;
