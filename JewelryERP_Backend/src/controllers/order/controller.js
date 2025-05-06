//#region imports
const { Op } = require("sequelize");
const { statusCodes, folderPrefix } = require("../../utils/constants");
const Order = require("../../models/order/order");
const Customer = require("../../models/customer/customer");
const Category = require("../../models/category/category");
const { Sequelize } = require("sequelize");
const Gender = require("../../models/misc/gender");
const Subcategory = require("../../models/subcategory/subcategory");
const Brands = require("../../models/misc/brands");
const Styles = require("../../models/misc/styles");
const Occasion = require("../../models/misc/occasion");
const MetalColor = require("../../models/materialItems/metalColor");
const MetalType = require("../../models/materialItems/metalType");
const ProductType = require("../../models/misc/productTypes");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Task = require("../../models/task/taskModel");  // Add this line
const Sketch = require("../../models/sketches/sketches");
const Cad = require("../../models/cad/cad"); // Add this line for Cad model
const Render = require("../../models/render/render"); // Add this line for Render model
const Design = require("../../models/design/design"); // Add this line for Render model
const { uploadFileToCdn } = require("../../Helper/fileUpload/fileUploadHelper");
const {
  getFileExtensionFromMimeType,
  checkFileType,
} = require("../../Helper/fileUpload/extractExtension");
const User = require("../../models/auth/userModel");
//#endregion

//#region modules

module.exports.createOrder = async (orderData) => {
  // Attempt to create the order
  const order = await Order.create(orderData);

  // Return success response if order creation is successful
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Order created successfully",
      data: order,
    },
  };
};

module.exports.updateOrderStatus = async (data) => {
  if (!["Approved", "Rejected", "Initiated"].includes(data.status)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message: "Invalid status. Allowed values: 'Approved', 'Rejected','Initiated'.",
      },
    };
  }

  const order = await Order.findByPk(data.orderId);
  if (!order) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Order not found.",
      },
    };
  }
  let obj = {};
  obj.status = data.status;
  if ((data.status =="Rejected" && data.reason)) obj.reason = data.reason;

  await order.update(obj);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: `Order status updated to ${data.status}.`,
      data: order,
    },
  };
};

module.exports.updateOrderStatusToSketch = async (orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Order not found",
      },
    };
  }

  order.orderStatus = "sketch";
  await order.save();

  const newSketch = await Sketch.create({ orderId });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Order status updated to Sketch",
      data: order,
    },
  };
};

module.exports.getAllOrders = async (page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  const { rows: orders, count: totalOrders } = await Order.findAndCountAll({
    attributes: [
      "id",
      "orderNo",
      "reason",
      "status",
      "orderStatus",
      "title",
      "isExclusive",
      [
        Sequelize.fn("to_char", Sequelize.col("orderDate"), "DD Mon YYYY"),
        "orderDate",
      ],
      [
        Sequelize.fn("to_char", Sequelize.col("promiseDate"), "DD Mon YYYY"),
        "promiseDate",
      ],
      [
        Sequelize.literal(
          `CASE WHEN status = 'Approved' THEN true ELSE false END`
        ),
        "isApproved",
      ],
      [
        Sequelize.literal(
          `CASE WHEN "orderStatus" = 'sketch' THEN true ELSE false END`
        ),
        "isSketch",
      ],
      [
        Sequelize.literal(`
          (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Order"."imageUrls"::jsonb) AS img)
        `),
        "imageUrls",
      ],
      [
        Sequelize.literal(`
          (SELECT "cadNo" FROM "Cads" WHERE "Cads"."orderId" = "Order"."id" LIMIT 1)
        `),
        "cadNo",
      ],
      [
        Sequelize.literal(`
          (SELECT "sketchNo" FROM "Sketch" WHERE "Sketch"."orderId" = "Order"."id" LIMIT 1)
        `),
        "sketchNo",
      ],
      [
        Sequelize.literal(`
          (SELECT "designNo" FROM "Design" WHERE "Design"."orderId" = "Order"."id" LIMIT 1)
        `),
        "designNo",
      ],
    ],
    include: [
      {
        model: Customer,
        attributes: ["customer_first_name"],
        required: true,
      },
      {
        model: Category,
        attributes: ["category_name"],
        required: true,
      },
    ],
    order: [["createdAt", "DESC"]], // Sorting by createdAt in descending order
    limit: pageSize,
    offset: offset,
    raw: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Orders fetched successfully",
      totalOrders,
      totalPages: Math.ceil(totalOrders / pageSize),
      currentPage: page,
      pageSize,
      data: orders,
    },
  };
};

module.exports.getOrderById = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    attributes: [
      "id",
      "orderNo",
      "reason",
      "title",
      "isExclusive",
      [
        Sequelize.fn("to_char", Sequelize.col("orderDate"), "DD Mon YYYY"),
        "orderDate",
      ],
      [
        Sequelize.fn("to_char", Sequelize.col("promiseDate"), "DD Mon YYYY"),
        "promiseDate",
      ],
      "requiredDesignCount",
      "expectedGrossWt",
      "expectedNetWt",
      "remarks",
      "diamondRange",
      "colorStoneRange",
      "priority",
      "isItemReceived",
      "status",
      "orderStatus",
      [
        Sequelize.literal(`
          (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Order"."imageUrls"::jsonb) AS img)
        `),
        "imageUrls",
      ],
    ],
    include: [
      {
        model: Customer,
        attributes: ["id", "customer_first_name", "address"], // Include foreign key and name
      },
      {
        model: ProductType,
        attributes: ["id", "product_types"], // Include foreign key and name
      },
      {
        model: Gender,
        attributes: ["id", "gender"], // Include foreign key and name
      },
      {
        model: CategoryGroup,
        attributes: ["id", "category_group_name"], // Include foreign key and name
      },
      {
        model: Category,
        attributes: ["id", "category_name"], // Include foreign key and name
      },
      {
        model: Subcategory,
        attributes: ["id", "subcategory_name"], // Include foreign key and name
      },
      {
        model: Brands,
        attributes: ["id", "brand_name"], // Include foreign key and name
      },
      {
        model: Styles,
        attributes: ["id", "style_name"], // Include foreign key and name
      },
      {
        model: Occasion,
        attributes: ["id", "occasion"], // Include foreign key and name
      },
      {
        model: MetalType,
        attributes: ["id", "metal_type"], // Include foreign key and name
      },
      {
        model: MetalColor,
        attributes: ["id", "metal_color_name"], // Include foreign key and name
      },
    ],
    raw: true, // Ensures the output is a flat object
  });

  if (!order) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Order not found",
      },
    };
  }

  const sketches = await Sketch.findAll({
    where: { orderId },
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
    order: [["id", "DESC"]],
  });

  const processedRows = sketches.map((sketch) => {
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

    const { Tasks, ...filteredSketch } = sketch.get({ plain: true });

    return {
      ...filteredSketch,
      taskImageUrls: taskImages.length > 0 ? taskImages : null,
      sketchers: taskUsers.length > 0 ? taskUsers : null,
    };
  });

  const cads = await Cad.findAll({
    where: { orderId },
    distinct: true,
    attributes: [
      "id",
      "cadNo",
      "orderId",
      "sketchId",
      "status",
      "reason",
      "cadStatus",
      [Sequelize.literal(`"Cad"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Cad"."cadStatus" = 'render'`), "isRender"],
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("cadBriefDate"), "DD Mon YYYY"),
        "cadBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("cadCompletedDate"),
          "DD Mon YYYY"
        ),
        "cadCompletedDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Cad"."promiseDate"'),
          "DD Mon YYYY"
        ),
        "promiseDate",
      ],
      "reqCadCount",
      "selectedCadCount",
      "specialInstruction",
      [
        Sequelize.literal(`(SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Cad"."imageUrls"::jsonb) AS img)`),
        "imageUrls",
      ],
    ],
    include: [
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
    order: [["id", "DESC"]],
  });

  // Process task image URLs and format response
  const cadRows = cads.map((cad) => {
    let taskImages = [];
    let taskUsers = [];
    if (cad.Tasks) {
      cad.Tasks.forEach((task) => {
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

    // Extract orderNo and remove `Order` and `Tasks` fields
    const { Tasks, Order, ...filteredCad } = cad.get({ plain: true });

    return {
      ...filteredCad,
      taskImageUrls: taskImages.length > 0 ? taskImages : null,
      cadDesigners: taskUsers.length > 0 ? taskUsers : null,
    };
  });

  const renders = await Render.findAll({
    where: { orderId },
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
        model: Cad,
        attributes: ["id", "cadNo"],
        required: true,
      },
      {
        model: Sketch,
        attributes: ["id", "sketchNo"],
        required: true,
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
    order: [["id", "DESC"]],
    distinct: true,
    raw: true,
  });

  const processedRenders = {};

  renders.forEach((render) => {
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
      if (
        !existingDesigners.some((designer) => designer.id === newDesigner.id)
      ) {
        existingDesigners.push(newDesigner);
      }
    }
  });
  const finalData = Object.values(processedRenders);

  const designs = await Design.findAll({
    where: {orderId},
    distinct: true,
  });

  const processedDesigns = designs.map((design) => {
    return {
      id: design.id,
      designNo: design.designNo,
      type: design.type,
      imageUrls:
        design.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`) ||
        [],
    };
  });

  order.sketches = sketches;
  order.cads = cadRows;
  order.renders = finalData;
  order.designs=processedDesigns
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Order fetched successfully",
      data: order,
    },
  };
};

module.exports.editOrder = async (orderId, updateData) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Order not found",
      },
    };
  }

  // Update only the fields provided in updateData
  let updatedOrder = await order.update(updateData);

  // Fetch updated order with formatted dates and foreign key IDs only
  /*  const updatedOrder = await Order.findByPk(orderId, {
      attributes: [
        "id",
        "orderNo",
        [
          Sequelize.fn("to_char", Sequelize.col("orderDate"), "DD Mon YYYY"),
          "orderDate",
        ],
        [
          Sequelize.fn("to_char", Sequelize.col("promiseDate"), "DD Mon YYYY"),
          "promiseDate",
        ],
        "requiredDesignCount",
        "expectedGrossWt",
        "expectedNetWt",
        "remarks",
        "diamondRange",
        "colorStoneRange",
        "priority",
        "isItemReceived",
        "status",
        "orderStatus",
        "customerId",
        "productTypeId",
        "genderId",
        "categoryGroupId",
        "categoryId",
        "subcategoryId",
        "brandId",
        "styleId",
        "occasionId",
        "metalTypeId",
        "metalColorId",
      ],
      raw: true,
    }); */

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Order updated successfully",
      data: updatedOrder,
    },
  };
};

module.exports.deleteOrder = async (orderId) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Order not found",
      },
    };
  }

  await order.destroy();

  return {
    status: 200,
    data: {
      message: "Order deleted successfully",
    },
  };
};

module.exports.uploadImage = async (req) => {
  if (!req.body.orderId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Order ID required" },
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
          status: statusCodes.UNPROCESSED,
          data: {message: "File not supported! (supports jpeg,jpg,jfif,png)"},
        };
      }
    }

    for (let i = 0; i < img.length; i++) {
      let fileExtension = getFileExtensionFromMimeType(img[i].mimetype);
      let fileName = `${folderPrefix.ORDER}${img[i].name.replace(
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

    let order = await Order.findByPk(req.body.orderId);
    if (!order) {
      return {
        status: statusCodes.NOTFOUND,
        data: { message: "Order not found" },
      };
    }

    // Append new images to existing ones (if any)
    let existingImages = order.imageUrls || [];
    order.imageUrls = [...existingImages, ...imgUrl];

    await order.save();
    let fullImageUrls = order.imageUrls.map(
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

module.exports.updateEmpIdForOrder = async (orderId, newEmpId) => {
    // Check if the order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return {
        status: statusCodes.NOTFOUND,
        data: {
          message: "Order not found",
        },
      };
    }

    // Check if the new employee exists
    const user = await User.findByPk(newEmpId);
    if (!user) {
      return {
        status: statusCodes.NOTFOUND,
        data: {
          message: "User (Employee) not found",
        },
      };
    }

    // Update empId
    await order.update({ empId: newEmpId });

    return {
      status: statusCodes.SUCCESS,
      data: {
        message: "Employee assigned to order successfully",
        data: order,
      },
    }; 
};

module.exports.searchOrders = async (filters, page = 1, pageSize = 10) => {  
  const whereClause = {};
  if (filters.orderId) {
    whereClause.orderNo = { [Op.iLike]: `%${filters.orderId}%` };
  }

  if (filters.customerId) {
    whereClause.customerId =parseInt(filters.customerId);
  }

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.orderDateStart && filters.orderDateEnd) {
    whereClause.orderDate = {
      [Op.between]: [new Date(filters.orderDateStart), new Date(filters.orderDateEnd)],
    };
  } else if (filters.orderDateStart) {
    whereClause.orderDate = {
      [Op.gte]: new Date(filters.orderDateStart),
    };
  } else if (filters.orderDateEnd) {
    whereClause.orderDate = {
      [Op.lte]: new Date(filters.orderDateEnd),
    };
  }

  if (filters.promiseDateStart && filters.promiseDateEnd) {
    whereClause.promiseDate = {
      [Op.between]: [new Date(filters.promiseDateStart), new Date(filters.promiseDateEnd)],
    };
  } else if (filters.promiseDateStart) {
    whereClause.promiseDate = {
      [Op.gte]: new Date(filters.promiseDateStart),
    };
  } else if (filters.promiseDateEnd) {
    whereClause.promiseDate = {
      [Op.lte]: new Date(filters.promiseDateEnd),
    };
  }

  const offset = (page - 1) * pageSize;

  const { count: totalOrders, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      { model: Customer, attributes: ["customer_first_name"] },
      { model: Category, attributes: ["category_name"] },
    ],
    limit: pageSize,
    offset,
  });

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    promiseDate: order.promiseDate ? new Date(order.promiseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null,
    orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null,
    requiredDesignCount: order.requiredDesignCount,
    customerId: order.customerId,
    productTypeId: order.productTypeId,
    genderId: order.genderId,
    categoryGroupId: order.categoryGroupId,
    categoryId: order.categoryId,
    subcategoryId: order.subcategoryId,
    brandId: order.brandId,
    styleId: order.styleId,
    occasionId: order.occasionId,
    metalTypeId: order.metalTypeId,
    metalColorId: order.metalColorId,
    status: order.status,
    orderStatus: order.orderStatus,
    expectedGrossWt: order.expectedGrossWt,
    expectedNetWt: order.expectedNetWt,
    remarks: order.remarks,
    diamondRange: order.diamondRange,
    colorStoneRange: order.colorStoneRange,
    priority: order.priority,
    isItemReceived: order.isItemReceived,
    imageUrls: order.imageUrls.map((img)=>`${process.env.AWS_IMAGE_URL}/${img}`),
    reason: order.reason,
    empId: order.empId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    "Customer.customer_first_name": order.Customer ? order.Customer.customer_first_name : null,
    "Category.category_name": order.Category ? order.Category.category_name : null,
  }));
  

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Orders fetched successfully",
      totalOrders,
      totalPages: Math.ceil(totalOrders / pageSize),
      currentPage: page,
      pageSize,
      data: formattedOrders,
    },
  };
};

module.exports.getAllOrderNos = async (searchQuery) => {
  const whereClause = searchQuery
    ? { orderNo: { [Op.like]: `%${searchQuery}%` } }
    : {};

  const orders = await Order.findAll({
    attributes: ["id", "orderNo"],
    where: whereClause,
    order: [["id", "DESC"]],
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Orders fetched successfully",
      data: orders,
    },
  };
};





//#endregion
