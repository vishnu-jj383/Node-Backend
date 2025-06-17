//#region imports
const designRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const designController=require('../../controllers/design')

//#endregion

//#region routing

designRouter.post("/getAllDesign",catchErrors(designController.getAllDesigns));

designRouter.post("/designerReport",catchErrors(designController.designerReport));

designRouter.post("/orderProductTypeReport", catchErrors(designController.orderProductTypeReport));
designRouter.get('/totaldesigncountReport', catchErrors(designController.totalDesignCountReport));

designRouter.get("/designToCustomer",catchErrors(designController.designToCustomer));

designRouter.get("/getDesignById/:id",catchErrors(designController.getDesignById));

designRouter.post("/sendDesignEmail",catchErrors(designController.sendDesignEmail));

designRouter.post("/designToCustomerSearch",catchErrors(designController.designToCustomerSearch));

designRouter.post("/designDeliveryReports",catchErrors(designController.designDeliveryReports));

designRouter.post("/getDesignReport",catchErrors(designController.getDesignReport));

designRouter.post("/searchDesignReport",catchErrors(designController.searchDesignReport));

designRouter.post("/searchDesignDeliveryReport",catchErrors(designController.searchDesignDeliveryReport));

designRouter.post("/searchDesignerReport",catchErrors(designController.searchDesignerReport));

designRouter.post("/searchAllDesigns",catchErrors(designController.searchAllDesigns));

designRouter.post("/getDesignsByCustomerId",catchErrors(designController.getDesignsByCustomerId));

designRouter.post("/FeedbackInsightReport",catchErrors(designController.FeedbackInsightReport));

designRouter.post("/sendDesignWhatsApp",catchErrors(designController.sendDesignWhatsApp));

designRouter.post("/updateManufactured",catchErrors(designController.updateManufactured));

//#endregion

module.exports = designRouter;