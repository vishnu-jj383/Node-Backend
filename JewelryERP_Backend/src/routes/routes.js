const express = require("express");
const userAuth = require("../middleware/auth");
const router = express.Router();


//#region routing

router.get("/testApi", (req, res) => {
  res
    .status(200)
    .json({ status: true, message: "API is working!", statusCode: 200 });
});

router.use("/auth", require("./authRoutes/authRoute"));

router.use("/customerAlbums", require("./customerAlbumsRoutes/customerAlbumRoutes"));

router.use("/materialItems", require("./materialItemsRoutes/materialItemsRoutes"));

router.use(userAuth)

router.use("/category", require("./categoryRoutes/categoryRoutes"));

router.use("/misc", require("./micsRoutes/miscRoutes"));

router.use("/customer", require("./customerRoutes/customerRoutes"));

router.use("/order", require("./orderRoutes/orderRoutes"));

router.use("/sketch", require("./sketchRoutes/sketchRoutes"));

router.use("/cad", require("./cadRoutes/cadRoutes"));

router.use("/render", require("./renderRoutes/renderRoutes"));

router.use("/design", require("./designRoutes/designRoutes"));

router.use("/album", require("./albumRoutes/albumRoutes"));

router.use("/tasks", require("./taskRoutes/taskRoutes"));

router.use("/dashboard", require("./dashboardRoutes/dashboardRoutes"));

//#endregion


module.exports = router;
