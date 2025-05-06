const statusCodes = {
    SUCCESS: 200,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOTFOUND: 404,
    UNPROCESSED: 422,
    ERROR: 500,
    NOTACCEPTABLE: 406,
    CONFLICT: 409,
    BADREQUEST: 400,
    UPDATED: 201,
    NOCONTENT: 204,
  };

  const folderPrefix = {
    ORDER: "order/",
    SKETCH:"sketch/",
    CAD:"cad/",
    RENDER:"render/",
    TASK:"task/"
  };

  const userCategory={
    ADMIN:"admin",
    USER:"user"
  }
  

  module.exports={
    statusCodes,
    folderPrefix,
    userCategory
  }