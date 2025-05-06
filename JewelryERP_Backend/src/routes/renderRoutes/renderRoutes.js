//#region imports
const renderRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const renderController=require('../../controllers/render')

//#endregion

//#region routing

renderRouter.post("/uploadImage",catchErrors(renderController.uploadImage));

renderRouter.put("/addRenderDesigner",catchErrors(renderController.addRenderDesigner));

renderRouter.put("/updateRender/:id",catchErrors(renderController.updateRender));

renderRouter.post("/getAllRenders",catchErrors(renderController.getAllRenders));

renderRouter.get("/getRenderById/:id",catchErrors(renderController.getRenderById));

renderRouter.put("/updateRenderStatus",catchErrors(renderController.updateRenderStatus));

renderRouter.put("/updateRenderStatusToDesign",catchErrors(renderController.updateRenderStatusToDesign));

renderRouter.post("/searchRenders",catchErrors(renderController.searchRenders));
//#endregion

module.exports = renderRouter;
