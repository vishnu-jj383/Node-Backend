const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Role = require("./roles");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isLogin:{
    type:DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emp_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // Ensures no duplicate employee IDs
  },
  emp_subsidiary: {
    type: DataTypes.STRING,
    allowNull: true, // Can be null if not always provided
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
   role: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emp_mobile_no: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isNumeric: true, // Ensures only numeric values
    },
  },
  supervisor_name: {
    type: DataTypes.STRING,
    allowNull: true, // Can be null for top-level employees
  },
  date_of_joining: {
    type: DataTypes.DATEONLY, // Stores only the date, not the time
    allowNull: true,
  },
  access: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  roleCategory: {
    type: DataTypes.STRING,
    allowNull: true, // Set to false if required
  },  
});

User.belongsTo(Role, {
  foreignKey: "role",
});

Role.hasMany(User, {
  foreignKey: "role",
});
module.exports = User;
