const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); // Assuming you have a sequelize configuration

const MaterialType = sequelize.define("MaterialType", {
  netsuite_id: {
    type: DataTypes.INTEGER,  // Type is number (INTEGER in Sequelize)
    allowNull: true, // netsuite_id is not required, so allowNull is true
  },
  material_class: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "material_types", 
  timestamps: false,  //
});

module.exports = MaterialType;
