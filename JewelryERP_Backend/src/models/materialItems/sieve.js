const { DataTypes } = require("sequelize");
const {sequelize} = require("../../configuration/db");
const DiamondStoneSize = require("./diamondStoneSize");
const DiamondSizeGroup = require("./diamondSizeGroup");

const Sieve = sequelize.define("Sieve", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  diamondStoneSizeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: DiamondStoneSize,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  sieveSize: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stoneWeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  tableName: "Sieve",
  timestamps: false,
});

// Associations
DiamondStoneSize.hasMany(Sieve, {
  foreignKey: "diamondStoneSizeId",
  as: "sieves",
});
Sieve.belongsTo(DiamondStoneSize, {
  foreignKey: "diamondStoneSizeId",
  as: "diamondStoneSize",
});
module.exports = Sieve;
