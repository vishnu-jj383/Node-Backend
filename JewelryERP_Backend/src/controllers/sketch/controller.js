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
const User = require("../../models/auth/userModel");
const { sequelize } = require("../../configuration/db");
const Customer = require("../../models/customer/customer");
const ProductType = require("../../models/misc/productTypes");
const Gender = require("../../models/misc/gender");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Category = require("../../models/category/category");
const Subcategory = require("../../models/subcategory/subcategory");
const Brands = require("../../models/misc/brands");
const Styles = require("../../models/misc/styles");
const Occasion = require("../../models/misc/occasion");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
const moment=require('moment');
const Role = require("../../models/auth/roles");
const Design = require("../../models/design/design");
//#endregion

//#region modules

module.exports.updateSketchDetails = async (sketchId, updateData) => {
  const sketch = await Sketch.findOne({ where: { id: sketchId } });

  if (!sketch) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Sketch not found",
      },
    };
  }

  await sketch.update(updateData);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch details updated successfully",
      data: sketch,
    },
  };
};

module.exports.getAllSketches = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Sketch.findAndCountAll({
    distinct: true, // Fix duplicate count issue
    attributes: [
      "id",
      "sketchNo",
      "orderId",
      "status",
      "sketchStatus",
      "reason",
      [Sequelize.literal(`"Sketch"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Sketch"."sketchStatus" = 'cad'`), "isCad"],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Sketch"."sketchBriefDate"'),
          "DD Mon YYYY"
        ),
        "sketchBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Sketch"."sketchCompletedDate"'),
          "DD Mon YYYY"
        ),
        "sketchCompletedDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Sketch"."promiseDate"'),
          "DD Mon YYYY"
        ),
        "promiseDate",
      ],
      "reqSketchCount",
      "selectedSketchCount",
      "specialInstructions",
      [
        Sequelize.literal(`
          (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Sketch"."imageUrls"::jsonb) AS img)
        `),
        "imageUrls",
      ],
    ],
    include: [
      {
        model: Order,
        attributes: [],
        required: true,
      },
      {
        model: Task,
        attributes: ["imageUrls"],
        required: false,
      },
    ],
    limit,
    offset,
    order: [["id", "DESC"]],
  });

  // ** Manually process task image URLs and remove "Tasks" array **
  const processedRows = rows.map((sketch) => {
    let taskImages = [];

    if (sketch.Tasks) {
      sketch.Tasks.forEach((task) => {
        if (task.imageUrls && Array.isArray(task.imageUrls)) {
          taskImages.push(
            ...task.imageUrls.map(
              (img) => `${process.env.AWS_IMAGE_URL}/${img}`
            )
          );
        }
      });
    }

    // Remove the `Tasks` field and only return required data
    const { Tasks, ...filteredSketch } = sketch.get({ plain: true });

    return {
      ...filteredSketch,
      taskImageUrls: taskImages.length > 0 ? taskImages : null, // Attach task images
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch details retrieved successfully",
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: processedRows,
    },
  };
};

module.exports.deleteSketch = async (sketchId) => {
  const deletedSketch = await Sketch.destroy({
    where: { id: sketchId },
  });

  if (!deletedSketch) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Sketch not found",
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch deleted successfully",
    },
  };
};

module.exports.addSketcher = async (req, res) => {
  const { empId, startDate, endDate, completedDate, id, type, reqCount } =
    req.body;

  if (!empId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message: "Sketcher ID is required",
      },
    };
  }

  const sketch = await Sketch.findOne({
    where: { id },
    attributes: ["id", "orderId"],
  });

  if (!sketch) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Sketch not found",
      },
    };
  }

  const task = await Task.findOne({
    where: { empId, id },
    attributes: ["id"],
  });

  if (task) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "sketcher is already assigned to this sketch",
      },
    };
  }

  const newTask = await Task.create({
    orderId: sketch.orderId,
    sketchId: sketch.id,
    empId,
    type,
    startDate: startDate || null,
    endDate: endDate || null,
    completedDate: completedDate || null,
    reqCount,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Task created successfully",
      data: newTask,
    },
  };
};

module.exports.updateSketchStatusToCad = async (id) => {
  const sketch = await Sketch.findByPk(id);
  if (!sketch) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "sketch not found",
      },
    };
  }

  sketch.sketchStatus = "cad";
  await sketch.save();
  const order = await Order.findByPk(sketch.orderId);
  order.orderStatus = "cad";
  await order.save();
  await Cad.create({
    orderId: sketch.orderId,
    sketchId: sketch.id,
    cadStatus: "cad",
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "sketch status updated to Sketch",
      data: sketch,
    },
  };
};

module.exports.uploadImage = async (req) => {
  if (!req.body.sketchId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Sketch ID required" },
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
      let fileName = `${folderPrefix.SKETCH}${img[i].name.replace(
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

    let sketch = await Sketch.findByPk(req.body.sketchId);
    if (!sketch) {
      return {
        status: statusCodes.NOTFOUND,
        data: { message: "sketch not found" },
      };
    }

    // Append new images to existing ones (if any)
    let existingImages = sketch.imageUrls || [];
    sketch.imageUrls = [...existingImages, ...imgUrl];

    await sketch.save();
    let fullImageUrls = sketch.imageUrls.map(
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

module.exports.updateSketchStatus = async (data) => {
  if (!["Approved", "Rejected", "Initiated"].includes(data.status)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message:
          "Invalid status. Allowed values: 'Approved', 'Rejected', 'Initiated'.",
      },
    };
  }

  const sketch = await Sketch.findByPk(data.sketchId, {
    include: [
      {
        model: Task,
        attributes: ["imageUrls"],
        required: false,
      },
    ],
  });

  if (!sketch) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Sketch not found.",
      },
    };
  }

  // Validation: If status is 'Approved', check for at least one task with imageUrls
  if (data.status === "Approved") {
    const hasValidTask = sketch.Tasks.some(
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
            "Cannot approve sketch. Assign Sketcher and upload sketch image.",
        },
      };
    }
  }

  let obj = { status: data.status };
  if (data.status === "Rejected" && data.reason) obj.reason = data.reason;

  await sketch.update(obj);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: `Sketch status updated to ${data.status}.`,
      data: sketch,
    },
  };
};

module.exports.addSketcher = async (req, res) => {
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
        message: "Sketcher ID is required",
        data: taskData,
      });
      continue;
    }

    const sketch = await Sketch.findOne({
      where: { id },
      attributes: ["id", "orderId"],
    });

    if (!sketch) {
      errors.push({
        status: statusCodes.NOTFOUND,
        message: "Sketch not found",
        data: taskData,
      });
      continue;
    }

    // Check if the same empId is already assigned to the same sketchId
    /* const taskExists = await Task.findOne({
      where: { empId, sketchId: sketch.id },
      attributes: ["id"],
    });

    if (taskExists) {
      errors.push({
        status: statusCodes.CONFLICT,
        message: `Sketcher with empId ${empId} is already assigned to this sketchId ${sketch.id}`,
        data: taskData,
      });
      continue;
    } */

    const newTask = await Task.create({
      orderId: sketch.orderId,
      sketchId: sketch.id,
      empId,
      type,
      selectedCount,
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

module.exports.addSketch = async (req) => {
  const transaction = await sequelize.transaction();
  const { orderId, empIds } = req.body;

  // Create the sketch
  const newSketch = await Sketch.create(
    {
      orderId: orderId || null,
    },
    { transaction }
  );

  // Find the last taskId to generate the next one
  const lastTask = await Task.findOne({
    order: [["id", "DESC"]],
    attributes: ["taskId"],
  });

  let newIdNumber = 100; // Default starting value if no tasks exist

  if (lastTask && lastTask.taskId) {
    const match = lastTask.taskId.match(/\d+/); // Extract numbers from TSKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  // Create task records with generated taskIds
  const tasks = empIds.map((empId, index) => ({
    taskId: `TSK${newIdNumber + index}`, // Ensure unique taskIds for each record
    orderId: newSketch.orderId,
    sketchId: newSketch.id,
    empId,
    type: "sketch",
  }));

  await Task.bulkCreate(tasks, { transaction });

  await transaction.commit();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch and tasks created successfully",
      data: newSketch,
    },
  };
};

module.exports.getSketchById = async (sketchId) => {
  const sketch = await Sketch.findOne({
    where: { id: sketchId },
    attributes: [
      "sketchNo",
      "orderId",
      "status",
      "sketchStatus",
      "reason",
      [Sequelize.literal(`"Sketch"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Sketch"."sketchStatus" = 'cad'`), "isCad"],
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("Sketch.sketchBriefDate"), "DD Mon YYYY"),
        "sketchBriefDate",
      ],
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("Sketch.sketchCompletedDate"), "DD Mon YYYY"),
        "sketchCompletedDate",
      ],
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("Sketch.promiseDate"), "DD Mon YYYY"),
        "promiseDate",
      ],
      "reqSketchCount",
      "selectedSketchCount",
      "specialInstructions",
    ],
    include: [
      {
        model: Order,
        attributes: [
          "id",
          "orderNo",
          [Sequelize.fn("TO_CHAR", Sequelize.col("Order.promiseDate"), "DD Mon YYYY"), "promiseDate"],
          [Sequelize.fn("TO_CHAR", Sequelize.col("Order.orderDate"), "DD Mon YYYY"), "orderDate"],
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
          { model: Customer, attributes: ["id", "customer_first_name", "address"] },
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

  if (!sketch) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Sketch not found" },
    };
  }

  // Combine imageUrls from all associated tasks
  const taskImageUrls = sketch.Tasks?.flatMap((task) => task.imageUrls || []) || [];

  // Extract unique employees based on id & roleName combo
  const uniqueEmployees = [];
  const employeeSet = new Set();

  if (sketch.Tasks) {
    for (const task of sketch.Tasks) {
      if (task.User) {
        const employeeKey = `${task.User.id}-${task.User.Role?.roleName}`;
        if (!employeeSet.has(employeeKey)) {
          employeeSet.add(employeeKey);
          uniqueEmployees.push({
            id: task.User.id,
            name: task.User.name,
            roleName: task.User.Role?.roleName,
          });
        }
      }
    }
  }

  // Convert to plain JSON & remove Tasks from the response
  const sketchData = sketch.get({ plain: true });
  delete sketchData.Tasks;

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch details retrieved successfully",
      data: {
        ...sketchData,
        imageUrls: taskImageUrls.length ? taskImageUrls : null,
        employee: uniqueEmployees.length ? uniqueEmployees : null,
      },
    },
  };
};

module.exports.addSketchFromDesign = async (req) => {
  const transaction = await sequelize.transaction();
  const { designId } = req.body;

  // Fetch orderId from Design table using designId
  const design = await Design.findOne({
    where: { id: designId },
    attributes: ["orderId"],
  });

  if (!design) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Design not found",
      },
    };
  }

  // Create the sketch with the retrieved orderId
  const newSketch = await Sketch.create(
    {
      orderId: design.orderId || null,
    },
    { transaction }
  );

  await transaction.commit();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch created successfully",
      data: newSketch,
    },
  };
};

module.exports.getAllSketches = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Sketch.findAndCountAll({
    distinct: true, // Fix duplicate count issue
    attributes: [
      "id",
      "sketchNo",
      "orderId",
      "status",
      "sketchStatus",
      "reason",
      [Sequelize.literal(`"Sketch"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Sketch"."sketchStatus" = 'cad'`), "isCad"],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Sketch"."sketchBriefDate"'),
          "DD Mon YYYY"
        ),
        "sketchBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Sketch"."sketchCompletedDate"'),
          "DD Mon YYYY"
        ),
        "sketchCompletedDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Sketch"."promiseDate"'),
          "DD Mon YYYY"
        ),
        "promiseDate",
      ],
      "reqSketchCount",
      "selectedSketchCount",
      "specialInstructions",
      [
        Sequelize.literal(`
          (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Sketch"."imageUrls"::jsonb) AS img)
        `),
        "imageUrls",
      ],
    ],
    include: [
      {
        model: Order,
        attributes: ["orderNo"],
        required: true,
        include: [
          {
            model: Customer,
            attributes: ["id","customer_first_name"],
            required: true,
          },
        ],
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
  });

  const processedRows = rows.map((sketch) => {
    let taskImages = [];
    let taskUsers = [];

    if (sketch.Tasks) {
      sketch.Tasks.forEach((task) => {
        if (task.imageUrls && Array.isArray(task.imageUrls)) {
          taskImages.push(
            ...task.imageUrls.map(
              (img) => `${process.env.AWS_IMAGE_URL}/${img}`
            )
          );
        }
        if (task.User) {
          taskUsers.push({ id: task.User.id, name: task.User.name });
        }
      });
    }

    const { Tasks, Order, ...filteredSketch } = sketch.get({ plain: true });

    return {
      ...filteredSketch,
      orderNo: Order.orderNo,
      customerName:Order.Customer.customer_first_name,
      taskImageUrls: taskImages.length > 0 ? taskImages : null,
      sketchers: taskUsers.length > 0 ? taskUsers : null,
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch details retrieved successfully",
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: processedRows,
    },
  };
};

module.exports.searchSketches = async (filters) => {
  const whereClause = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.sketchNo) {
    whereClause.sketchNo = { [Op.iLike]: `%${filters.sketchNo}%` };
  }

  if (filters.sketchBriefDateStart && filters.sketchBriefDateEnd) {
    whereClause.sketchBriefDate = {
      [Op.between]: [
        new Date(filters.sketchBriefDateStart),
        new Date(filters.sketchBriefDateEnd),
      ],
    };
  } else if (filters.sketchBriefDateStart) {
    whereClause.sketchBriefDate = {
      [Op.gte]: new Date(filters.sketchBriefDateStart),
    };
  } else if (filters.sketchBriefDateEnd) {
    whereClause.sketchBriefDate = {
      [Op.lte]: new Date(filters.sketchBriefDateEnd),
    };
  }

  const taskWhereClause = {};
  if (filters.userId) {
    taskWhereClause.empId = filters.userId;
  }

  // Add orderNo filter to the Order model's where clause
  const orderWhereClause = {};
  if (filters.orderNo) {
    orderWhereClause.orderNo = { [Op.iLike]: `%${filters.orderNo}%` };
  }

  const sketches = await Sketch.findAll({
    where: whereClause,
    include: [
      {
        model: Task,
        where: taskWhereClause,
        required: !!filters.userId,
        include: [
          {
            model: User,
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: Order,
        attributes: ["id", "orderNo"],
        where: orderWhereClause, // Apply the orderNo filter here
        required: !!filters.orderNo, // Make the join required if orderNo is provided
      },
    ],
    order: [["id", "DESC"]],
  });

  // Transform response to match the required format
  const modifiedSketches = sketches.map((sketch) => {
    const sketchers = [];
    const seenSketchers = new Set();

    sketch.Tasks.forEach((task) => {
      if (task.User && !seenSketchers.has(task.User.id)) {
        sketchers.push({
          id: task.User.id,
          name: task.User.name,
        });
        seenSketchers.add(task.User.id);
      }
    });

    return {
      id: sketch.id,
      sketchNo: sketch.sketchNo,
      orderId: sketch.orderId,
      orderNo: sketch.Order?.orderNo,
      status: sketch.status,
      sketchStatus: sketch.sketchStatus,
      reason: sketch.reason,
      isApproved: sketch.isApproved,
      isCad: sketch.isCad,
      sketchBriefDate: sketch.sketchBriefDate
        ? moment(sketch.sketchBriefDate).format("DD MMM YYYY")
        : null,
      sketchCompletedDate: sketch.sketchCompletedDate
        ? moment(sketch.sketchCompletedDate).format("DD MMM YYYY")
        : null,
      promiseDate: sketch.promiseDate
        ? moment(sketch.promiseDate).format("DD MMM YYYY")
        : null,
      reqSketchCount: sketch.reqSketchCount,
      selectedSketchCount: sketch.selectedSketchCount,
      specialInstructions: sketch.specialInstructions,
      imageUrls: sketch.imageUrls,
      taskImageUrls: sketch.taskImageUrls,
      sketchers, // Renamed and formatted correctly
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketches fetched successfully",
      data: modifiedSketches,
    },
  };
};

//#endregion
