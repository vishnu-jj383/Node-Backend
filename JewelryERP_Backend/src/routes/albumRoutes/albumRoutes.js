//#region imports
const albumRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const albumController=require('../../controllers/Album')

//#endregion

//#region routing
 
albumRouter.post("/sendAlbum",catchErrors(albumController.sendAlbum));

albumRouter.post("/createAlbum",catchErrors(albumController.createAlbum));

albumRouter.post("/getAllAlbum",catchErrors(albumController.getAllAlbum));

albumRouter.post("/getAlbumsByCustomerId/:id",catchErrors(albumController.getAlbumsByCustomerId));

albumRouter.post("/sendAlbumByEmail",catchErrors(albumController.sendAlbumByEmail));

albumRouter.post("/getDesignsByAlbumId",catchErrors(albumController.getDesignsByAlbumId));

albumRouter.post("/searchAlbumsByCustomer",catchErrors(albumController.searchAlbumsByCustomer));

albumRouter.post("/searchAlbumsOfCustomer",catchErrors(albumController.searchAlbumsOfCustomer));

//#endregion

module.exports = albumRouter;
