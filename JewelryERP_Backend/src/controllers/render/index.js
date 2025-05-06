//#region imports
let renderService = require("./controller");
//#endregion

//#region routes
module.exports.addRenderDesigner = async (req, res) => {
  let result = await renderService.addRenderDesigner(req);
  res.status(result.status).send(result.data);
};

module.exports.uploadImage = async (req, res) => {
  let result = await renderService.uploadImage(req);
  res.status(result.status).send(result.data);
};

module.exports.updateRender = async (req, res) => {
  let result = await renderService.updateRender(req.params.id, req.body);
  res.status(result.status).send(result.data);
};

module.exports.getAllRenders = async (req, res) => {
  let result = await renderService.getAllRenders(req.body.page, req.body.pageSize);
  res.status(result.status).send(result.data);
};

module.exports.updateRenderStatus = async (req, res) => {
  let result = await renderService.updateRenderStatus(req.body);
  res.status(result.status).send(result.data);
}; 

module.exports.updateRenderStatusToDesign = async (req, res) => {
  let result = await renderService.updateRenderStatusToDesign(req.body.renderId);
  res.status(result.status).send(result.data);
};

module.exports.getRenderById = async (req, res) => {
  let result = await renderService.getRenderById(req.params.id);
  res.status(result.status).send(result.data);
};

module.exports.searchRenders = async (req, res) => {
  let result = await renderService.searchRenders(req.body);
  res.status(result.status).send(result.data);
};
//#endregion
