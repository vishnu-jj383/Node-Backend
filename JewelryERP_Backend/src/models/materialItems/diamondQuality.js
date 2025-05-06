const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const MaterialType = require("../../models/materialItems/materialType");
const DiamondQualityGroup = require("../../models/materialItems/diamondQualityGroup");

const DiamondQuality = sequelize.define(
  "DiamondQuality",
  {
    diamond_quality: {
      type: DataTypes.STRING,
      allowNull: false,
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
    diamond_quality_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: DiamondQualityGroup,
        key: "id",
      },
    },
  },
  {
    tableName: "diamond_qualities",
    timestamps: false,
  }
);

// Relationships
DiamondQuality.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
MaterialType.hasMany(DiamondQuality, { foreignKey: "material_type_id", as: "diamondQualities" });

DiamondQuality.belongsTo(DiamondQualityGroup, { foreignKey: "diamond_quality_group_id", as: "diamondQualityGroup" });
DiamondQualityGroup.hasMany(DiamondQuality, { foreignKey: "diamond_quality_group_id", as: "diamondQualities" });

module.exports = DiamondQuality;
