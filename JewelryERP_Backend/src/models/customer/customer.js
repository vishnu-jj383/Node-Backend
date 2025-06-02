const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const User = require("../auth/userModel");

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    customer_status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    customer_username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    customer_first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // phone_number: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customer_type: {
      type: DataTypes.ENUM("individual", "business"),
      allowNull: false,
      defaultValue: "individual",
    },
    customer_fax: {
       type: DataTypes.STRING,
      allowNull: true,
    },
    customercode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country_subsidiary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customer_country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    empId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    tableName: "customers",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date",
  }
);
Customer.belongsTo(User, { foreignKey: "empId" });
User.hasMany(Customer, { foreignKey: "empId" });
module.exports = Customer;
