const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); 
const MaterialType = require("../../models/materialItems/materialType");
const DiamondSizeGroup = require("../../models/materialItems/diamondSizeGroup");

const DiamondStoneSize = sequelize.define(
  "DiamondStoneSize",
  {
    stone_size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sizeMm: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MaterialType,
        key: "id",
      },
    },
    diamond_size_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: DiamondSizeGroup,
        key: "id",
      },
    },
  },
  {
    tableName: "diamond_stone_sizes",
    timestamps: false,
  }
);

// Establish Relationships
DiamondStoneSize.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
DiamondStoneSize.belongsTo(DiamondSizeGroup, { foreignKey: "diamond_size_group_id", as: "diamondSizeGroup" });

MaterialType.hasMany(DiamondStoneSize, { foreignKey: "material_type_id" });
DiamondSizeGroup.hasMany(DiamondStoneSize, { foreignKey: "diamond_size_group_id" });

module.exports = DiamondStoneSize;
