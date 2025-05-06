//#region imports
let taskservice = require("./controller");
//#endregion

//#region routes

module.exports.uploadImage = async (req, res) => {
  let result = await taskservice.uploadImage(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllTasksByType = async (req, res) => {
  let result = await taskservice.getAllTasksByType(req);
  res.status(result.status).send(result.data);
};

module.exports.getTasksByOrderIdOrType = async (req, res) => {
  let result = await taskservice.getTasksByOrderIdOrType(req);
  res.status(result.status).send(result.data);
};

module.exports.updateSelectedImagesCustomer = async (req, res) => {
  let result = await taskservice.updateSelectedImagesCustomer(req);
  res.status(result.status).send(result.data);
};

module.exports.updateSelectedImagesDew = async (req, res) => {
  let result = await taskservice.updateSelectedImagesDew(req);
  res.status(result.status).send(result.data);
};

module.exports.updateApprovalStatusCustomer = async (req, res) => {
  let result = await taskservice.updateApprovalStatusCustomer(req.body.taskId,req.body.isApproved);
  res.status(result.status).send(result.data);
};

module.exports.updateApprovalStatusOwn = async (req, res) => {
  let result = await taskservice.updateApprovalStatusOwn(req.body.taskId,req.body.isApproved);
  res.status(result.status).send(result.data);
};

module.exports.updateTask = async (req, res) => {
  let result = await taskservice.updateTask(req.params.id,req.body);
  res.status(result.status).send(result.data);
};

module.exports.getTaskById = async (req, res) => {
  let result = await taskservice.getTaskById(req);
  res.status(result.status).send(result.data);
};

module.exports.deleteImages = async (req, res) => {
  let result = await taskservice.deleteImages(req);
  res.status(result.status).send(result.data);
};

module.exports.workInProgress = async (req, res) => {
  let result = await taskservice.workInProgress(req);
  res.status(result.status).send(result.data);
};

module.exports.searchWorkInProgress = async (req, res) => {
  let result = await taskservice.searchWorkInProgress(req);
  res.status(result.status).send(result.data);
};

module.exports.getTaskImagesByType = async (req, res) => {
  let result = await taskservice.getTaskImagesByType(req);
  res.status(result.status).send(result.data);
};

module.exports.searchTaskImagesByType = async (req, res) => {
  let result = await taskservice.searchTaskImagesByType(req);
  res.status(result.status).send(result.data);
};
//#endregion
