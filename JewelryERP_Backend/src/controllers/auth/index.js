//#region imports
let authService = require("./controller");
//#endregion

//#region routes
module.exports.signup = async (req, res) => {
  let result = await authService.signup(req);
  res.status(result.status).send(result.data);
};

module.exports.login = async (req, res) => {
  let result = await authService.login(req);
  res.status(result.status).send(result.data);
};

module.exports.addRoles = async (req, res) => {
  let result = await authService.addRoles(req.body.roles);
  res.status(result.status).send(result.data);
};

module.exports.getAllRoles = async (req, res) => {
  let result = await authService.getAllRoles(req.body.type);
  res.status(result.status).send(result.data);
};

module.exports.updateAccess = async (req, res) => {
  let result = await authService.updateAccess(req);
  res.status(result.status).send(result.data);
};

module.exports.addUser = async (req, res) => {
  let result = await authService.addUser(req);
  res.status(result.status).send(result.data);
};

module.exports.updateUser = async (req, res) => {
  let result = await authService.updateUser(req);
  res.status(result.status).send(result.data);
};

module.exports.getUsersByRoleType = async (req, res) => {
  let result = await authService.getUsersByRoleType(req.body.type);
  res.status(result.status).send(result.data);
};

module.exports.getAllUsers = async (req, res) => {
  let result = await authService.getAllUsers(req);
  res.status(result.status).send(result.data);
};

module.exports.getUserById = async (req, res) => {
  let result = await authService.getUserById(req.params.id);
  res.status(result.status).send(result.data);
};
//#endregion
