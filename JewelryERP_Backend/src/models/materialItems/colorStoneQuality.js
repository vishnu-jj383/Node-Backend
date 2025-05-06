const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); // Adjust path as needed
const MaterialType = require("../../models/materialItems/materialType");
const ColorStoneQualityGroup = require("../../models/materialItems/colorStoneQualityGroup");

const ColorStoneQuality = sequelize.define(
  "ColorStoneQuality",
  {
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stone_quality: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MaterialType,
        key: "id",
      },
    },
    color_stone_quality_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: ColorStoneQualityGroup,
        key: "id",
      },
    },
  },
  {
    tableName: "color_stone_qualities",
    timestamps: false, // Enables createdAt and updatedAt fields
  }
);

// Establish Relationships
ColorStoneQuality.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
MaterialType.hasMany(ColorStoneQuality, { foreignKey: "material_type_id" });

ColorStoneQuality.belongsTo(ColorStoneQualityGroup, { foreignKey: "color_stone_quality_group_id", as: "colorStoneQualityGroup" });
ColorStoneQualityGroup.hasMany(ColorStoneQuality, { foreignKey: "color_stone_quality_group_id" });

module.exports = ColorStoneQuality;
