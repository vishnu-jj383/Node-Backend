//#region imports
let cadService = require("./controller");
//#endregion

//#region routes
module.exports.uploadImage = async (req, res) => {
  let result = await cadService.uploadImage(req);
  res.status(result.status).send(result.data);
};

module.exports.addCadDesigner = async (req, res) => {
  let result = await cadService.addCadDesigner(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllCads = async (req, res) => {
  let result = await cadService.getAllCads(req.body.page,req.body.pageSize);
  res.status(result.status).send(result.data);
};

module.exports.updateCad = async (req, res) => {
  let result = await cadService.updateCad(req.params.id,req.body);
  res.status(result.status).send(result.data);
};

module.exports.getCadById = async (req, res) => {
  let result = await cadService.getCadById(req.params.id);
  res.status(result.status).send(result.data);
};

module.exports.addAssemblyItem = async (req, res) => {
  let result = await cadService.addAssemblyItem(req);
  res.status(result.status).send(result.data);
};

module.exports.getAssemblyItemsByCadId = async (req, res) => {
  let result = await cadService.getAssemblyItemsByCadId(req.body.cadId);
  res.status(result.status).send(result.data);
};

module.exports.updateCadStatusToRender = async (req, res) => {
  let result = await cadService.updateCadStatusToRender(req.body.cadId);
  res.status(result.status).send(result.data);
};

module.exports.updateCadStatus = async (req, res) => {
  let result = await cadService.updateCadStatus(req.body);
  res.status(result.status).send(result.data);
};

module.exports.updateCad = async (req, res) => {
  let result = await cadService.updateCad(req);
  res.status(result.status).send(result.data);
};

module.exports.searchCads = async (req, res) => {
  let result = await cadService.searchCads(req.body);
  res.status(result.status).send(result.data);
};

module.exports.addCad = async (req, res) => {
  let result = await cadService.addCad(req);
  res.status(result.status).send(result.data);
};

module.exports.addCadFromDesign = async (req, res) => {
  let result = await cadService.addCadFromDesign(req);
  res.status(result.status).send(result.data);
};

module.exports.deleteAssemblyItem = async (req, res) => {
  let result = await cadService.deleteAssemblyItem(req.params.id);
  res.status(result.status).send(result.data);
};
//#endregion
