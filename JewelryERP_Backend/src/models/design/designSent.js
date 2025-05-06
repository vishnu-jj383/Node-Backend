const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Design = require("../design/design");
const Customer = require("../customer/customer");
const Album = require("../album/albums");

const DesignSent = sequelize.define(
  "DesignSent",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    designId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Design,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Customer,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    sentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Sent", "Viewed"),
      allowNull: false,
      defaultValue: "Pending",
    },   
    albumId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Initially null until an album is created
      references: {
        model: Album,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
  },
  {
    tableName: "DesignSent",
    timestamps: true,
  }
);

DesignSent.belongsTo(Design, { foreignKey: "designId" });
DesignSent.belongsTo(Customer, { foreignKey: "customerId" });
DesignSent.belongsTo(Album, { foreignKey: "albumId" });

Design.hasMany(DesignSent, { foreignKey: "designId" });
Customer.hasMany(DesignSent, { foreignKey: "customerId" });
Album.hasMany(DesignSent, { foreignKey: "albumId" });

module.exports = DesignSent;
