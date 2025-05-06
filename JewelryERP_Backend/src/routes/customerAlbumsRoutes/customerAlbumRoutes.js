//#region imports
const customerAlbumRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const customerAlbumController=require('../../controllers/customerAlbums')

//#endregion

//#region routing

customerAlbumRouter.get("/getAllDesignsForCustomer/:id",catchErrors(customerAlbumController.getAllDesignsForCustomer));

customerAlbumRouter.get("/getDesignById/:id",catchErrors(customerAlbumController.getDesignById));

customerAlbumRouter.get("/getAllDesignsForDew",catchErrors(customerAlbumController.getAllDesignsForDew));

customerAlbumRouter.post("/addCustomerFeedback",catchErrors(customerAlbumController.addCustomerFeedback));

customerAlbumRouter.post("/getAllCustomerFeedback",catchErrors(customerAlbumController.getAllCustomerDesignUpdates));

customerAlbumRouter.post("/searchCustomerFeedback",catchErrors(customerAlbumController.searchCustomerFeedback));

customerAlbumRouter.get("/getAlbumsByCustomerId/:id",catchErrors(customerAlbumController.getAlbumsByCustomerId));

customerAlbumRouter.get("/getAllDesignsForAlbum/:id",catchErrors(customerAlbumController.getAllDesignsForAlbum));

//#endregion

module.exports = customerAlbumRouter;