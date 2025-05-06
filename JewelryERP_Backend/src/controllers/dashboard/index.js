//#region imports
let dashboardService = require("./controller");
//#endregion

//#region routes

module.exports.getDashboardSummary = async (req, res) => {
  let result = await dashboardService.getDashboardSummary();
  res.status(result.status).send(result.data);
};

module.exports.getBarChart = async (req, res) => {
  let result = await dashboardService.getBarChart(req.body.type,req.body.startYear,req.body.endYear);
  res.status(result.status).send(result.data);
};

//#endregion
