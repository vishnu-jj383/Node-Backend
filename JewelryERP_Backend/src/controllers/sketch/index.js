//#region imports
let sketchService = require("./controller");
//#endregion

//#region routes

module.exports.updateSketchDetails = async (req, res) => {
  let result = await sketchService.updateSketchDetails(req.params.id, req.body);
 res.status(result.status).send(result.data);
};

module.exports.getAllSketches = async (req, res) => {
  let result = await sketchService.getAllSketches(req.body.page,req.body.pageSize);
 res.status(result.status).send(result.data);
};

module.exports.getSketchById = async (req, res) => {
  let result = await sketchService.getSketchById(req.params.id);
 res.status(result.status).send(result.data);
};

module.exports.deleteSketch = async (req, res) => {
  let result = await sketchService.deleteSketch(req.params.id);
 res.status(result.status).send(result.data);
};

module.exports.addSketcher = async (req, res) => {
  let result = await sketchService.addSketcher(req);
 res.status(result.status).send(result.data);
};

module.exports.updateSketchStatusToCad = async (req, res) => {
  let result = await sketchService.updateSketchStatusToCad(req.body.sketchId);
 res.status(result.status).send(result.data);
};

module.exports.uploadImage = async (req, res) => {
  let result = await sketchService.uploadImage(req);
 res.status(result.status).send(result.data);
};

module.exports.updateSketchStatus = async (req, res) => {
  let result = await sketchService.updateSketchStatus(req.body);
 res.status(result.status).send(result.data);
};

module.exports.searchSketches = async (req, res) => {
  let result = await sketchService.searchSketches(req.body);
 res.status(result.status).send(result.data);
};

module.exports.addSketch = async (req, res) => {
  let result = await sketchService.addSketch(req);
 res.status(result.status).send(result.data);
};

module.exports.addSketchFromDesign = async (req, res) => {
  let result = await sketchService.addSketchFromDesign(req);
 res.status(result.status).send(result.data);
};

//#endregion
