const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const DesignSent = require("../design/designSent");
const Customer = require("../customer/customer");

const Album = sequelize.define(
    "Album",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      albumNo: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      albumName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
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
      imageUrls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Stores an array of image URLs",
      }, 
      designIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER), 
        allowNull: true, 
        defaultValue: [], 
      }, 
      isAlbumSent: {
        type: DataTypes.BOOLEAN, 
        defaultValue: false,     
      },
    },
    {
      tableName: "Album",
      timestamps: true,
    }
  );
  
Album.beforeValidate(async (album) => {
  const lastAlbum = await Album.findOne({
    order: [["id", "DESC"]],
    attributes: ["albumNo"],
  });

  let newIdNumber = 100; // Start from SK100 if no previous designes exist

  if (lastAlbum && lastAlbum.albumNo) {
    const match = lastAlbum.albumNo.match(/\d+/); // Extract numbers from SKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  album.albumNo = `ALB${newIdNumber}`;
});

Album.belongsTo(Customer, { foreignKey: "customerId" });
Customer.hasMany(Album, { foreignKey: "customerId" });
 
module.exports = Album;
