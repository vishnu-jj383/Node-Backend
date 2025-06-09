//#region imports
let designService = require("./controller");
//#endregion

//#region routes
module.exports.getAllDesigns = async (req, res) => {
  let result = await designService.getAllDesigns(req);
  res.status(result.status).send(result.data);
};

module.exports.designerReport = async (req, res) => {
  let result = await designService.designerReport(req);
  res.status(result.status).send(result.data);
};

module.exports.designToCustomer = async (req, res) => {
  let result = await designService.designToCustomer(req.body.page,req.body.pageSize);
  res.status(result.status).send(result.data);
};

module.exports.getDesignById = async (req, res) => {
  let result = await designService.getDesignById(req.params.id);
  res.status(result.status).send(result.data);
};

module.exports.sendDesignEmail = async (req, res) => {
  let result = await designService.sendDesignEmail(req.body.customer,req.body.designs,req.body.designPageLink);
  res.status(result.status).send(result.data);
};

module.exports.designToCustomerSearch = async (req, res) => {
  let result = await designService.designToCustomerSearch(req.body.customerID,req.body.page,req.body.limit);
  res.status(result.status).send(result.data);
};

module.exports.designDeliveryReports = async (req, res) => {
  let result = await designService.designDeliveryReports(req.body);
  res.status(result.status).send(result.data);
};

module.exports.getDesignReport = async (req, res) => {
  let result = await designService.getDesignReport(req.body);
  res.status(result.status).send(result.data);
};

module.exports.searchDesignReport = async (req, res) => {
  let result = await designService.searchDesignReport(req.body);
  res.status(result.status).send(result.data);
};

module.exports.searchDesignDeliveryReport = async (req, res) => {
  let result = await designService.searchDesignDeliveryReport(req.body);
  res.status(result.status).send(result.data);
};

module.exports.searchDesignerReport = async (req, res) => {
  let result = await designService.searchDesignerReport(req.body);
  res.status(result.status).send(result.data);
};

module.exports.searchAllDesigns = async (req, res) => {
  let result = await designService.searchAllDesigns(req);
  res.status(result.status).send(result.data);
};

module.exports.getDesignsByCustomerId = async (req, res) => {
  let result = await designService.getDesignsByCustomerId(req.body.customerId);
  res.status(result.status).send(result.data);
};

module.exports.FeedbackInsightReport = async (req, res) => {
  let result = await designService.FeedbackInsightReport(req.body.page,req.body.pageSize);
  res.status(result.status).send(result.data);
};

module.exports.sendDesignWhatsApp = async (req, res) => {
  let result = await designService.sendDesignWhatsApp(req.body.customer,req.body.designs,req.body.designPageLink);
  res.status(result.status).send(result.data);
};

module.exports.updateManufactured = async (req, res) => {
  let result = await designService.updateManufactured(req.body.designId,req.body.isManufactured);
  res.status(result.status).send(result.data);
};

// module.exports.orderProductTypeReport = async (req, res) => {
//   let reportType = req.query.reportType || req.body.reportType || "weekly"; // Default to weekly
//   let result = await designService.orderProductTypeReport(reportType);
//   res.status(result.status).send(result.data);
// };
module.exports.
  orderProductTypeReport= async (req, res) => {
    const result = await designService.orderProductTypeReport(req);
    res.status(result.status).send(result.data);
  }

//#endregion
