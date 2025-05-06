//#region imports
const dashboardRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const dashboardController=require('../../controllers/dashboard')

//#endregion

//#region routing

dashboardRouter.get("/getDashboardSummary",catchErrors(dashboardController.getDashboardSummary));

dashboardRouter.post("/getBarChart",catchErrors(dashboardController.getBarChart));


//#endregion

module.exports = dashboardRouter;