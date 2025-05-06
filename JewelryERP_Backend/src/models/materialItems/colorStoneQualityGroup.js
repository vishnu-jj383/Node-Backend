const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); // Adjust path as needed
const MaterialType = require("../../models/materialItems/materialType"); // Assuming the correct path for materialType

const ColorStoneQualityGroup = sequelize.define(
  "ColorStoneQualityGroup",
  {
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Not required, can be null
    },
    stone_quality_group: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Foreign key relationship
      references: {
        model: MaterialType, // Foreign key points to the MaterialType model
        key: "id",
      },
    },
  },
  {
    tableName: "color_stone_quality_groups",
    timestamps: false, // Enables createdAt and updatedAt fields
  }
);

// Establish Relationships
ColorStoneQualityGroup.belongsTo(MaterialType, {
  foreignKey: "material_type_id",
  as: "materialType", // Alias for materialType relationship
});

MaterialType.hasMany(ColorStoneQualityGroup, {
  foreignKey: "material_type_id",
  as: "colorStoneQualityGroups", // Alias for the reverse relationship
});

module.exports = ColorStoneQualityGroup;
