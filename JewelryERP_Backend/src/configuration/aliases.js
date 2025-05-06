const moduleAlias = require("module-alias");
const path = require("path");
/**
 * Configure Module Aliases
 * Create aliases for common module paths(short length) to improve code readability and maintainability.
 * Each alias corresponds to a specific directory in the project.
 */

const rootDir = path.join(__dirname, "..");

moduleAlias.addAliases({
//   "@root": rootDir,
//   "@controllers": path.join(rootDir, "controllers"),
  "@errorHandlers": path.join(rootDir, "errorHandlers"),
//   "@routes": path.join(rootDir, "routes"),
//   "@middleware": path.join(rootDir, "middleware"),
//   "@models": path.join(rootDir, "models"),
//   "@validations": path.join(rootDir, "validations"),
//   "@helpers": path.join(rootDir, "helpers"),
//   "@seed": path.join(rootDir, "seed"),
//   "@configuration": path.join(rootDir, "configuration"),
//   "@utils": path.join(rootDir, "utils"),
//   "@locales": path.join(rootDir, "locales")
});