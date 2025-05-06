const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const MetalClass = require("./metalClass");
const MaterialType = require("./materialType");

const MetalQuality = sequelize.define(
  "MetalQuality",
  {
    metal_quality: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    quality_mfg_clarity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    metal_class_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MetalClass,
        key: "id",
      },
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
    tableName: "metal_qualities",
    timestamps: false,
  }
);

// Relationships
MetalQuality.belongsTo(MetalClass, { foreignKey: "metal_class_id" });
MetalQuality.belongsTo(MaterialType, { foreignKey: "material_type_id" });

module.exports = MetalQuality;
