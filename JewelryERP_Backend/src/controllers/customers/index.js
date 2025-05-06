//#region imports
let customerService = require("./controller");
//#endregion

//#region routes

module.exports.addCustomer = async (req, res) => {
  let result = await customerService.addCustomer(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllCustomers = async (req, res) => {
  let result = await customerService.getAllCustomers(req);
  res.status(result.status).send(result.data);
};

module.exports.getCustomerById = async (req, res) => {
  let result = await customerService.getCustomerById(req);
  res.status(result.status).send(result.data);
};

module.exports.editCustomer = async (req, res) => {
  let result = await customerService.editCustomer(req);
  res.status(result.status).send(result.data);
};

module.exports.deleteCustomer = async (req, res) => {
  let result = await customerService.deleteCustomer(req);
  res.status(result.status).send(result.data);
};

module.exports.getCustomers = async (req, res) => {
  let result = await customerService.getCustomers(req);
  res.status(result.status).send(result.data);
};

module.exports.searchCustomers = async (req, res) => {
  let result = await customerService.searchCustomers(req);
  res.status(result.status).send(result.data);
};
//#endregion
