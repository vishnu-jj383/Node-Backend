const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); // Adjust path as needed
const MaterialType = require("../../models/materialItems/materialType"); // Assuming this is the correct path

const DiamondSizeGroup = sequelize.define(
  "DiamondSizeGroup",
  {
    diamond_size_group: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure the name is required
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Optional NetSuite ID
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MaterialType, // Foreign key relationship
        key: "id",
      },
    },
  },
  {
    tableName: "diamond_size_groups",
    timestamps: false,
  }
);

// Establish Relationships
DiamondSizeGroup.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
MaterialType.hasMany(DiamondSizeGroup, { foreignKey: "material_type_id", as: "diamondSizeGroups" });

module.exports = DiamondSizeGroup;
