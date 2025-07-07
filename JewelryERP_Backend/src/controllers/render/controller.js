//#region imports
const { statusCodes, folderPrefix } = require("../../utils/constants");
const Order = require("../../models/order/order");
const { Op, Sequelize } = require("sequelize");
const Sketch = require("../../models/sketches/sketches");
const Task = require("../../models/task/taskModel");
const { format } = require("date-fns");
const Cad = require("../../models/cad/cad");
const {
  checkFileType,
  getFileExtensionFromMimeType,
} = require("../../Helper/fileUpload/extractExtension");
const { uploadFileToCdn } = require("../../Helper/fileUpload/fileUploadHelper");
const Render = require("../../models/render/render");
const Design = require("../../models/design/design");
const User = require("../../models/auth/userModel");
const Customer = require("../../models/customer/customer");
const Gender = require("../../models/misc/gender");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Category = require("../../models/category/category");
const Subcategory = require("../../models/subcategory/subcategory");
const Brands = require("../../models/misc/brands");
const Styles = require("../../models/misc/styles");
const Occasion = require("../../models/misc/occasion");
const Role = require("../../models/auth/roles");
const ProductType = require("../../models/misc/productTypes");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
//#endregion

//#region modules
module.exports.uploadImage = async (req) => {
  if (!req.body.renderId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Render ID required" },
    };
  }
  let img = [],
    imgUrl = [];
  if (req.files && req.files?.images) {
    if (!Array.isArray(req.files.images)) img.push(req.files.images);
    else img = req.files.images;
    for (let i = 0; i < img.length; i++) {
      let result = await checkFileType(img[i].mimetype);
      if (!result) {
        return {
          status: statusCodes.NOTACCEPTABLE,
          data: { message: "check file type" },
        };
      }
    }

    for (let i = 0; i < img.length; i++) {
      let fileExtension = getFileExtensionFromMimeType(img[i].mimetype);
      let fileName = `${folderPrefix.RENDER}${img[i].name.replace(
        /\s/g,
        ""
      )}_${Date.now()}${fileExtension}`;
      let upload = await uploadFileToCdn(
        img[i].data,
        fileName,
        img[i].mimetype
      );
      if (!upload.status) {
        return {
          status: statusCodes.UNPROCESSED,
          data: { message: upload.message },
        };
      }
      imgUrl.push(`${upload.url}`);
    }

    let render = await Render.findByPk(req.body.renderId);
    if (!render) {
      return {
        status: statusCodes.NOTFOUND,
        data: { message: "render not found" },
      };
    }

    // Append new images to existing ones (if any)
    let existingImages = render.imageUrls || [];
    render.imageUrls = [...existingImages, ...imgUrl];

    await render.save();
    let fullImageUrls = render.imageUrls.map(
      (img) => `${process.env.AWS_IMAGE_URL}/${img}`
    );

    return {
      status: statusCodes.SUCCESS,
      data: fullImageUrls,
    };
  } else {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Image is required" },
    };
  }
};

module.exports.addRenderDesigner = async (req, res) => {
  const { empId, startDate, endDate, completedDate, id, type } = req.body;

  if (!empId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message: "Render Designer ID is required",
      },
    };
  }

  const render = await Render.findOne({
    where: { id },
    attributes: ["id", "orderId"],
  });

  if (!render) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "render not found",
      },
    };
  }

  /*   const task = await Task.findOne({
    where: { empId, id, type },
    attributes: ["id"],
  });

  if (task) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "render designer is already assigned to this render",
      },
    };
  } */

  const newTask = await Task.create({
    orderId: render.orderId,
    renderId: render.id,
    empId,
    type,
    startDate: startDate || null,
    endDate: endDate || null,
    completedDate: completedDate || null,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Task created successfully",
      data: newTask,
    },
  };
};

module.exports.updateRender = async (renderId, updateData) => {
  // Check if the Render exists
  const render = await Render.findByPk(renderId);
  if (!render) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Render not found",
      },
    };
  }

  // Update the Render record
  await render.update(updateData);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Render updated successfully",
      data: render, // Returning the updated Render
    },
  };
};

module.exports.getAllRenders = async (page = 1, limit = 10) => {  
  const offset = (page - 1) * limit;

  const { count, rows } = await Render.findAndCountAll({
    attributes: [
      "id",
      "orderId",
      "cadId",
      "sketchId",
      "status",
      "renderStatus",
      "renderNo",
      "reason",
      "reqRenderCount",
      "specialInstructions",
      [Sequelize.literal(`"Render"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Render"."renderStatus" = 'design'`), "isDesign"],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("renderBriefDate"),
          "DD Mon YYYY"
        ),
        "renderBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("renderCompletedDate"),
          "DD Mon YYYY"
        ),
        "renderCompletedDate",
      ],
      [
        Sequelize.literal(`
          COALESCE(
            (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || task_img)
             FROM LATERAL (
               SELECT jsonb_array_elements_text(t."imageUrls"::jsonb) AS task_img
               FROM "task" t WHERE t."renderId" = "Render"."id"
             ) subquery
            ), '[]'::jsonb
          )
        `),
        "taskImageUrls",
      ],
    ],
    include: [
      {
        model: Order,
        attributes: ["id", "orderNo"],
        required: true,
      },
      {
        model: Cad,
        attributes: ["id", "cadNo"],
        required: true,
      },
      {
        model: Sketch,
        attributes: ["id", "sketchNo"],
        required: false,
      },
      {
        model: Task,
        attributes: ["imageUrls", "empId"],
        required: false,
        include: [
          {
            model: User,
            attributes: ["id", "name"],
            required: false,
          },
        ],
      },
    ],
    limit,
    offset,
    order: [["id", "DESC"]],
    distinct: true,
    raw: true,
  });


  const processedRenders = {};

rows.forEach((render) => {
  const renderKey = render.renderNo;

  if (!processedRenders[renderKey]) {
    processedRenders[renderKey] = {
      id: render.id,
      orderId: render.orderId,
      orderNo: render["Order.orderNo"] || null,
      cadId: render.cadId,
      cadNo: render["Cad.cadNo"] || null,
      sketchId: render.sketchId,
      sketchNo: render["Sketch.sketchNo"] || null,
      status: render.status,
      renderStatus: render.renderStatus,
      renderNo: render.renderNo,
      reason: render.reason,
      reqRenderCount: render.reqRenderCount,
      specialInstructions: render.specialInstructions,
      isApproved: render.isApproved,
      isDesign: render.isDesign,
      renderBriefDate: render.renderBriefDate || null,
      renderCompletedDate: render.renderCompletedDate || null,
      taskImageUrls: render.taskImageUrls || [],
      renderDesigners: [],
    };
  }

  if (render["Tasks.User.id"]) {
    const newDesigner = {
      id: render["Tasks.User.id"],
      name: render["Tasks.User.name"] || null,
    };

    const existingDesigners = processedRenders[renderKey].renderDesigners;
    if (!existingDesigners.some((designer) => designer.id === newDesigner.id)) {
      existingDesigners.push(newDesigner);
    }
  }
});

const finalData = Object.values(processedRenders);

return {
  status: statusCodes.SUCCESS,
  data: {
    message: "Render details retrieved successfully",
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: finalData,
  },
}
};

module.exports.getRenderById = async (renderId) => {
  const render = await Render.findOne({
    where: { id: renderId },
    attributes: [
      "id",
      "orderId",
      "cadId",
      "sketchId",
      "status",
      "renderNo",
      "renderStatus",
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("renderBriefDate"),
          "DD Mon YYYY"
        ),
        "renderBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("renderCompletedDate"),
          "DD Mon YYYY"
        ),
        "renderCompletedDate",
      ],

      "reqRenderCount",
      "specialInstructions",
      "reason",
      [
        Sequelize.literal(`
          (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Render"."imageUrls"::jsonb) AS img)
        `),
        "imageUrls",
      ],
      [Sequelize.literal(`"Render"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Render"."renderStatus" = 'design'`), "isDesign"],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("renderBriefDate"),
          "DD Mon YYYY"
        ),
        "renderBriefDateFormatted",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("renderCompletedDate"),
          "DD Mon YYYY"
        ),
        "renderCompletedDateFormatted",
      ],
    ],
    include: [
      {
        model: Order,
        attributes: [
          "id",
          "orderNo",
          [
            Sequelize.fn(
              "TO_CHAR",
              Sequelize.col('"Order"."promiseDate"'),
              "DD Mon YYYY"
            ),
            "promiseDate",
          ],
          [
            Sequelize.fn(
              "TO_CHAR",
              Sequelize.col('"Order"."orderDate"'),
              "DD Mon YYYY"
            ),
            "orderDate",
          ],
          "requiredDesignCount",
          "status",
          "orderStatus",
          "expectedGrossWt",
          "expectedNetWt",
          "remarks",
          "diamondRange",
          "colorStoneRange",
          "priority",
          "isItemReceived",
          "reason",
          "empId",
        ],
        required: true,
        include: [
          {
            model: Customer,
            attributes: ["id", "customer_first_name", "address"],
          },
          { model: ProductType, attributes: ["id", "product_types"] },
          { model: Gender, attributes: ["id", "gender"] },
          { model: CategoryGroup, attributes: ["id", "category_group_name"] },
          { model: Category, attributes: ["id", "category_name"] },
          { model: Subcategory, attributes: ["id", "subcategory_name"] },
          { model: Brands, attributes: ["id", "brand_name"] },
          { model: Styles, attributes: ["id", "style_name"] },
          { model: Occasion, attributes: ["id", "occasion"] },
          { model: MetalType, attributes: ["id", "metal_type"] },
          { model: MetalColor, attributes: ["id", "metal_color_name"] },
        ],
      },
      {
        model: Cad,
        attributes: ["id", "cadNo"],
        required: true,
      },
      {
        model: Sketch,
        attributes: ["id", "sketchNo"],
        required: false,
        // required: true,
      },
      {
        model: Task,
        required: false,
        attributes: [
          "taskId",
          [
            Sequelize.literal(`(
              SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
              FROM jsonb_array_elements_text("Tasks"."imageUrls"::jsonb) AS img
            )`),
            "imageUrls",
          ],
        ],
        include: [
          {
            model: User,
            attributes: ["id", "name"],
            include: [{ model: Role, attributes: ["roleName"] }],
          },
        ],
      },
    ],
  });

  if (!render) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Render record not found!" },
    };
  }
  // Combine imageUrls from all associated tasks
  const taskImageUrls =
    render.Tasks?.flatMap((task) => task.imageUrls || []) || [];

  // Extract unique employee details
  const employees =
    render.Tasks?.flatMap((task) =>
      task.User
        ? [
            {
              id: task.User.id,
              name: task.User.name,
              roleName: task.User.Role?.roleName,
            },
          ]
        : []
    ) || [];

  const renderData = render.get({ plain: true });
  delete renderData.Tasks;

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Render details retrieved successfully",
      data: {
        ...renderData,
        imageUrls: taskImageUrls.length ? taskImageUrls : null,
        employee: employees.length ? employees : null,
      },
    },
  };

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Render record retrieved successfully",
      data: render,
    },
  };
};

module.exports.updateRenderStatus = async (data) => {
  if (!["Approved", "Rejected", "Initiated"].includes(data.status)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message:
          "Invalid status. Allowed values: 'Approved', 'Rejected', 'Initiated'.",
      },
    };
  }

  const render = await Render.findByPk(data.renderId, {
    include: [
      {
        model: Task,
        attributes: ["imageUrls"],
        required: false,
      },
    ],
  });

  if (!render) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Render not found.",
      },
    };
  }

  // Validation: If status is 'Approved', check for at least one task with imageUrls
  if (data.status === "Approved") {
    const hasValidTask = render.Tasks.some(
      (task) =>
        task.imageUrls &&
        Array.isArray(task.imageUrls) &&
        task.imageUrls.length > 0
    );

    if (!hasValidTask) {
      return {
        status: statusCodes.NOTACCEPTABLE,
        data: {
          message:
            "Cannot approve Render. Assign Render designer and upload Render image.",
        },
      };
    }
  }

  let obj = { status: data.status };
  if (data.status === "Rejected" && data.reason) obj.reason = data.reason;

  await render.update(obj);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: `Render status updated to ${data.status}.`,
      data: render,
    },
  };
};

module.exports.updateRenderStatusToDesign = async (id) => {
  const render = await Render.findByPk(id);
  if (!render) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Render not found",
      },
    };
  }

  // Get tasks related to the render
  const tasks = await Task.findAll({
    where: { renderId: render.id },
    attributes: ["imageUrls", "isApprovedOwn", "isApprovedCustomer"],
  });

  // Group image URLs by type
  let imageUrlsByType = { dew: [], others: [] };
  for (const task of tasks) {
    if (task.isApprovedOwn) {
      imageUrlsByType.dew.push(...task.imageUrls);
    }
    if (task.isApprovedCustomer) {
      imageUrlsByType.others.push(...task.imageUrls);
    }
  }
  if (!imageUrlsByType.dew.length && !imageUrlsByType.others.length)
    return {
      status: statusCodes.UNPROCESSED,
      data: {
        message: "No images found in render",
      },
    };
  // Insert exactly two Design records (if applicable)
  for (const [type, imageUrls] of Object.entries(imageUrlsByType)) {
    if (imageUrls.length > 0) {
      await Design.create({
        orderId: render.orderId,
        cadId: render.cadId,
        sketchId: render.sketchId,
        renderId: render.id,
        designStatus: "design",
        imageUrls,
        type,
      });
    }
  }

  render.renderStatus = "design";
  await render.save();

  // Update related entities
  await Order.update(
    { orderStatus: "design",statusDate : new Date() },
    { where: { id: render.orderId } }
  );
  await Sketch.update(
    { sketchStatus: "design" },
    { where: { id: render.sketchId } }
  );
  await Cad.update({ cadStatus: "design" }, { where: { id: render.cadId } });
  await Render.update({ renderStatus: "design" }, { where: { id: render.id } });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Render status updated to design",
      data: render,
    },
  };
};

module.exports.addRenderDesigner = async (req, res) => {
  let tasksToInsert = Array.isArray(req.body) ? req.body : [req.body]; // Ensure array format

  let createdTasks = [];
  let errors = [];

  for (const taskData of tasksToInsert) {
    const {
      empId,
      startDate,
      endDate,
      completedDate,
      id,
      type,
      selectedCount,
      reqCount,
    } = taskData;

    if (!empId) {
      errors.push({
        status: statusCodes.NOTACCEPTABLE,
        message: "Render Designer ID is required",
        data: taskData,
      });
      continue;
    }

    const render = await Render.findOne({
      where: { id },
      attributes: ["id", "orderId"],
    });

    if (!render) {
      errors.push({
        status: statusCodes.NOTFOUND,
        message: "Render not found",
        data: taskData,
      });
      continue;
    }

    // Prevent assigning the same empId to the same renderId multiple times
    /*  const taskExists = await Task.findOne({
      where: { empId, renderId: render.id, type },
      attributes: ["id"],
    });

    if (taskExists) {
      errors.push({
        status: statusCodes.CONFLICT,
        message: `Render Designer with empId ${empId} is already assigned to renderId ${render.id}`,
        data: taskData,
      });
      continue;
    } */

    const newTask = await Task.create({
      orderId: render.orderId,
      renderId: render.id,
      empId,
      type,
      selectedCount, // Now included
      startDate: startDate || null,
      endDate: endDate || null,
      completedDate: completedDate || null,
      reqCount,
    });

    createdTasks.push(newTask);
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: createdTasks.length
        ? "Tasks processed successfully"
        : "No tasks were created",
      createdTasks,
      errors: errors.length ? errors : null,
    },
  };
};

module.exports.searchRenders = async (filters) => {
  const whereClause = {};
  if (filters.startRenderCompletedDate && filters.endRenderCompletedDate) {
    whereClause.renderCompletedDate = {
      [Op.between]: [
        new Date(`${filters.startRenderCompletedDate}T00:00:00.000Z`),
        new Date(`${filters.endRenderCompletedDate}T23:59:59.999Z`),
      ],
    };
  } else if (filters.startRenderCompletedDate) {
    whereClause.renderCompletedDate = {
      [Op.gte]: new Date(`${filters.startRenderCompletedDate}T00:00:00.000Z`),
    };
  } else if (filters.endRenderCompletedDate) {
    whereClause.renderCompletedDate = {
      [Op.lte]: new Date(`${filters.endRenderCompletedDate}T23:59:59.999Z`),
    };
  }

  // Filter by renderNo
  if (filters.renderNo) {
    whereClause.renderNo = { [Op.iLike]: `%${filters.renderNo}%` }
  }

  // Filter by status
  if (filters.status) {
    whereClause.status = filters.status;
  }


  const renders = await Render.findAll({
    where: whereClause,
    attributes: [
      "id",
      "orderId",
      "cadId",
      "sketchId",
      "renderNo",
      "status",
      "renderStatus",
      "reqRenderCount",
      "specialInstructions",
      "reason",
      [Sequelize.fn("TO_CHAR", Sequelize.col("renderBriefDate"), "DD Mon YYYY"), "renderBriefDate"],
      [Sequelize.fn("TO_CHAR", Sequelize.col("renderCompletedDate"), "DD Mon YYYY"), "renderCompletedDate"],
      [
        Sequelize.literal(`
          COALESCE(
            (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || task_img)
             FROM LATERAL (
               SELECT jsonb_array_elements_text(t."imageUrls"::jsonb) AS task_img
               FROM "task" t WHERE t."renderId" = "Render"."id"
             ) subquery
            ), '[]'::jsonb
          )
        `),
        "taskImageUrls",
      ],
    ],
    include: [
      { model: Order, attributes: ["orderNo"] },
      {
        model: Task,
        attributes: ["imageUrls", "empId"],
        required: false,
        include: [{ model: User, attributes: ["id", "name"], required: false }],
      },
    ],
    distinct: true, // Ensures unique Render records
  });

   const formattedRenders = renders.map((render) => {
    const renderDesigners = render.Tasks.map(task => ({
      id: task.User?.id || null,
      name: task.User?.name || null,
    }));

    return {
      id: render.id,
      orderId: render.orderId,
      orderNo: render.Order?.orderNo || null,
      renderNo: render.renderNo,
      cadId: render.cadId,
      sketchId: render.sketchId,
      status: render.status,
      renderStatus: render.renderStatus,
      renderBriefDate: render.renderBriefDate || null,
      renderCompletedDate: render.renderCompletedDate || null,
      reqRenderCount: render.reqRenderCount,
      specialInstructions: render.specialInstructions,
      reason: render.reason,
      taskImageUrls: render.taskImageUrls,
      renderDesigners,
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: { message: "Renders retrieved successfully", data: formattedRenders },
  };
};

//#endregion
