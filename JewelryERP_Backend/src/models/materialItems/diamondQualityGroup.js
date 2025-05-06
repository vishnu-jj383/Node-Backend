const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); 
const MaterialType = require("../../models/materialItems/materialType"); 

const DiamondQualityGroup = sequelize.define(
  "DiamondQualityGroup",
  {
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    diamond_quality_group: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MaterialType,
        key: "id",
      },
    },
  },
  {
    tableName: "diamond_quality_groups",
    timestamps: false,
  }
);

// Fix the alias issue by explicitly naming it
DiamondQualityGroup.belongsTo(MaterialType, {
  foreignKey: "material_type_id",
  as: "materialType",
});
MaterialType.hasMany(DiamondQualityGroup, {
  foreignKey: "material_type_id",
  as: "diamondQualityGroups",
});

module.exports = DiamondQualityGroup;
