//#region imports
const { statusCodes, folderPrefix } = require("../../utils/constants");
const Task = require("../../models/task/taskModel");
const { Op } = require("sequelize");
const {
  checkFileType,
  getFileExtensionFromMimeType,
} = require("../../Helper/fileUpload/extractExtension");
const { uploadFileToCdn } = require("../../Helper/fileUpload/fileUploadHelper");
const User = require("../../models/auth/userModel");
const {
  deleteFileFromCdn,
} = require("../../Helper/fileUpload/fileUploadHelper"); // Import the delete function
const Sketch = require("../../models/sketches/sketches");
const Cad = require("../../models/cad/cad");
const Render = require("../../models/render/render");
const Order = require("../../models/order/order");
const Customer = require("../../models/customer/customer");
const Design = require("../../models/design/design")
const moment = require("moment-timezone");
//#endregion

//#region modules

module.exports.uploadImage = async (req) => {
  if (!req.body.taskId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Task ID required" },
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
          data: { message: "File not supported! (supports jpeg,jpg,jfif,png)" },
        };
      }
    }

    for (let i = 0; i < img.length; i++) {
      let fileExtension = getFileExtensionFromMimeType(img[i].mimetype);
      let fileName = `${folderPrefix.TASK}${img[i].name.replace(
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

    let task = await Task.findByPk(req.body.taskId);
    if (!task) {
      return {
        status: statusCodes.NOTFOUND,
        data: { message: "task not found" },
      };
    }

    // Append new images to existing ones (if any)
    let existingImages = task.imageUrls || [];
    task.imageUrls = [...existingImages, ...imgUrl];

    await task.save();
    let fullImageUrls = task.imageUrls.map(
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

module.exports.getAllTasksByType = async (req) => {
  const { type } = req.body;
  if (!type) {
    return {
      status: statusCodes.UNPROCESSED,
      data: { message: "Type is required in the request body" },
    };
  }

  const tasks = await Task.findAll({
    where: { type },
  });

  // Prefix AWS URL to all image-related fields
  const updatedTasks = tasks.map((task) => ({
    ...task.toJSON(),
    imageUrls:
      task.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`) || [],
  }));

  return {
    status: statusCodes.SUCCESS,
    data: { tasks: updatedTasks },
  };
};

module.exports.updateSelectedImagesCustomer = async (req) => {
  const { taskId, selectedImageUrlsCustomer } = req.body;

  if (!taskId || !Array.isArray(selectedImageUrlsCustomer)) {
    return {
      status: statusCodes.UNPROCESSED,
      data: {
        message: "taskId and selectedImageUrlsCustomer array are required",
      },
    };
  }

  const task = await Task.findOne({ where: { id: taskId } });

  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Task not found" },
    };
  }

  // Trim AWS prefix if present
  const trimmedUrls = selectedImageUrlsCustomer.map((url) =>
    url.startsWith(process.env.AWS_IMAGE_URL)
      ? url.replace(process.env.AWS_IMAGE_URL, "")
      : url
  );

  await task.update({ selectedImageUrlsCustomer: trimmedUrls });

  return {
    status: statusCodes.SUCCESS,
    data: { message: "selectedImageUrlsCustomer updated successfully" },
  };
};

module.exports.updateSelectedImagesDew = async (req) => {
  const { taskId, selectedImageUrlsDew } = req.body;

  if (!taskId || !Array.isArray(selectedImageUrlsDew)) {
    return {
      status: statusCodes.UNPROCESSED,
      data: { message: "taskId and selectedImageUrlsDew array are required" },
    };
  }

  const task = await Task.findOne({ where: { id: taskId } }); // Ensure taskId is a string

  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Task not found" },
    };
  }

  // Trim AWS prefix if present
  const trimmedUrls = selectedImageUrlsDew.map((url) =>
    url.startsWith(process.env.AWS_IMAGE_URL)
      ? url.replace(process.env.AWS_IMAGE_URL, "")
      : url
  );

  await task.update({ selectedImageUrlsDew: trimmedUrls });

  return {
    status: statusCodes.SUCCESS,
    data: { message: "selectedImageUrlsDew updated successfully" },
  };
};

module.exports.updateApprovalStatusCustomer = async (taskId, isApproved) => {
  const task = await Task.findOne({ where: { id: taskId } });

  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Task not found",
      },
    };
  }
  task.isApprovedCustomer = isApproved;
  task.selectedCount = 1;
  await task.save();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Approval status updated successfully",
      data: task,
    },
  };
};

module.exports.updateApprovalStatusOwn = async (taskId, isApproved) => {
  const task = await Task.findOne({ where: { id: taskId } });

  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Task not found",
      },
    };
  }

  task.isApprovedOwn = isApproved;
  task.selectedCount = 1;
  await task.save();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Approval status updated successfully",
      data: task,
    },
  };
};

module.exports.updateTask = async (id, updateData) => {
  const task = await Task.findByPk(id);

  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Task not found",
      },
    };
  }

  // Update task with provided fields
  await task.update(updateData);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Task updated successfully",
      data: task,
    },
  };
};

module.exports.getTaskById = async (req, res) => {
  const { id } = req.params; // Get task ID from request parameters

  const task = await Task.findOne({
    where: { id },
    include: [
      {
        model: User,
        attributes: ["id", "name"],
      },
    ],
  });

  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Task not found",
      },
    };
  }

  // Format date function
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  // Formatting the response
  const formattedTask = {
    id: task.id,
    taskId: task.taskId,
    orderId: task.orderId,
    sketchId: task.sketchId,
    cadId: task.cadId,
    renderId: task.renderId,
    empId: task.empId,
    startDate: formatDate(task.startDate), // Convert date format
    endDate: formatDate(task.endDate), // Convert date format
    completedDate: formatDate(task.completedDate), // Convert date format
    type: task.type,
    imageUrls:
      task.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`) || [],
    reqCount: task.reqCount,
    isApprovedCustomer: task.isApprovedCustomer,
    isApprovedOwn: task.isApprovedOwn,
    Employee: task.User ? { id: task.User.id, name: task.User.name } : null,
  };

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Task retrieved successfully",
      data: formattedTask,
    },
  };
};

module.exports.deleteImages = async (req) => {
  if (!req.body.taskId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Task ID required" },
    };
  }

  if (!req.body.imageUrls || !Array.isArray(req.body.imageUrls)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Valid image URLs required" },
    };
  }

  let task = await Task.findByPk(req.body.taskId);
  if (!task) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Task not found" },
    };
  }

  let existingImages = task.imageUrls || [];
  let imagesToDelete = req.body.imageUrls;

  // Ensure the requested images exist in the task
  let validImages = imagesToDelete.filter((img) =>
    existingImages.includes(img.replace(`${process.env.AWS_IMAGE_URL}/`, ""))
  );

  if (validImages.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "No matching images found in task" },
    };
  }

  // Delete images from S3
  for (let imageUrl of validImages) {
    let fileName = imageUrl.replace(`${process.env.AWS_IMAGE_URL}/`, ""); // Extract filename from full URL
    let deleteResponse = await deleteFileFromCdn(fileName);
    if (!deleteResponse.status) {
      return {
        status: statusCodes.UNPROCESSED,
        data: { message: deleteResponse.message },
      };
    }
  }

  // Update the task record
  task.imageUrls = existingImages.filter(
    (img) => !validImages.includes(`${process.env.AWS_IMAGE_URL}/${img}`)
  );

  await task.save();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Images deleted successfully",
      remainingImages: task.imageUrls,
    },
  };
};



// module.exports.workInProgress = async (req) => {
//   const { page = 1, pageSize = 10 } = req.body;
//   const offset = (page - 1) * pageSize;

//   const { count, rows: tasks } = await Task.findAndCountAll({
//     attributes: ["taskId", "startDate", "endDate"],
//     include: [
//       {
//         model: Order,
//         attributes: ["orderNo", "orderStatus", "customerId"],
//         include: [
//           {
//             model: Customer,
//             attributes: ["customer_first_name"],
//           },
//         ],
//       },
//       {
//         model: User,
//         attributes: ["name"],
//       },
//     ],
//     limit: parseInt(pageSize),
//     offset: parseInt(offset),
//   });

//   return {
//     status: statusCodes.SUCCESS,
//     data: {
//       message: "Work in progress tasks retrieved successfully",
//       totalRecords: count,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(count / pageSize),
//       data: tasks.map((task) => {
//         const startDate = task.startDate ? new Date(task.startDate) : null;
//         const endDate = task.endDate ? new Date(task.endDate) : null;

//         // Calculate difference in days between startDate and endDate
//         const noOfDays =
//           startDate && endDate
//             ? Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
//             : null;

//         return {
//           taskNo: task.taskId,
//           orderNo: task.Order?.orderNo || "",
//           orderStatus: task.Order?.orderStatus || "",
//           customerName: task.Order?.Customer?.customer_first_name || "",
//           startDate: startDate
//             ? startDate.toLocaleDateString("en-GB", {
//                 day: "2-digit",
//                 month: "short",
//                 year: "numeric",
//               })
//             : "",
//           endDate: endDate
//             ? endDate.toLocaleDateString("en-GB", {
//                 day: "2-digit",
//                 month: "short",
//                 year: "numeric",
//               })
//             : "",
//           noOfDays: noOfDays !== null ? `${noOfDays} days` : "",
//           designer: task.User?.name || "",
//         };
//       }),
//     },
//   };
// };


// module.exports.workInProgress = async (req) => {
//   try {
//     // Validate and sanitize pagination parameters
//     let page = parseInt(req.body.page) || 1;
//     let pageSize = parseInt(req.body.pageSize) || 10;

//     // Ensure positive values
//     page = page > 0 ? page : 1;
//     pageSize = pageSize > 0 ? pageSize : 10;

//     // Cap pageSize to prevent excessive data fetching
//     pageSize = Math.min(pageSize, 100);

//     const offset = (page - 1) * pageSize;

//     const { count, rows: orders } = await Order.findAndCountAll({
//       attributes: ["orderNo", "orderStatus", "customerId", "statusDate", "orderDate", "promiseDate"],
//       where: {
//         orderStatus: {
//           [Op.in]: ["order", "sketch", "cad", "render", "design"], // Filter for work-in-progress statuses
//         },
//       },
//       include: [
//         {
//           model: Customer,
//           attributes: ["customer_first_name"],
//           required: false,
//         },
//         {
//           model: Task,
//           attributes: ["taskId", "createdAt"], // Added createdAt for sorting
//           include: [
//             {
//               model: User,
//               attributes: ["name"],
//               required: false,
//             },
//           ],
//           required: false,
//         },
//         {
//           model: Sketch,
//           attributes: ["sketchBriefDate", "sketchCompletedDate"],
//           required: false,
//         },
//         {
//           model: Cad,
//           attributes: ["cadBriefDate", "cadCompletedDate"],
//           required: false,
//         },
//         {
//           model: Render,
//           attributes: ["renderBriefDate", "renderCompletedDate"],
//           required: false,
//         },
//         {
//           model: Design,
//           attributes: ["createdAt"],
//           required: false,
//         },
//       ],
//       limit: pageSize,
//       offset: offset,
//       distinct: true, // Ensure unique order counts
//     });

//     return {
//       status: statusCodes.SUCCESS,
//       data: {
//         message: "Work in progress orders retrieved successfully",
//         totalRecords: count,
//         currentPage: page,
//         totalPages: Math.ceil(count / pageSize),
//         data: orders.map((order) => {
//           const statusDate = order.statusDate ? new Date(order.statusDate) : null;
//           const currentDate = new Date();

//           // Calculate difference in days between status date and current date
//           const noOfDays =
//             statusDate
//               ? Math.floor((currentDate - statusDate) / (1000 * 60 * 60 * 24))
//               : null;

//           // Determine start and end dates based on orderStatus
//           let startDate = "";
//           let endDate = "";

//           switch (order.orderStatus) {
//             case "order":
//               startDate = order.orderDate
//                 ? new Date(order.orderDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               endDate = order.promiseDate
//                 ? new Date(order.promiseDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               break;
//             case "sketch":
//               startDate = order.Sketch?.sketchBriefDate
//               console.log(order.Sketch?.sketchBriefDate)
//                 ? new Date(order.Sketch.sketchBriefDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               endDate = order.Sketch?.sketchCompletedDate
//                 ? new Date(order.Sketch.sketchCompletedDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               break;
//             case "cad":
//               startDate = order.Cad?.cadBriefDate
//                 ? new Date(order.Cad.cadBriefDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               endDate = order.Cad?.cadCompletedDate
//                 ? new Date(order.Cad.cadCompletedDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               break;
//             case "render":
//               startDate = order.Render?.renderBriefDate
//                 ? new Date(order.Render.renderBriefDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               endDate = order.Render?.renderCompletedDate
//                 ? new Date(order.Render.renderCompletedDate).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               break;
//             case "design":
//               startDate = order.Design?.createdAt
//                 ? new Date(order.Design.createdAt).toLocaleDateString("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })
//                 : "";
//               endDate = "";
//               break;
//             default:
//               startDate = "";
//               endDate = "";
//           }

//           // Select the latest designer based on the most recent task
//           const latestDesigner = (order.Tasks || [])
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.User?.name || "";

//           return {
//             taskNo: order.Tasks?.[0]?.taskId || "",
//             orderNo: order.orderNo || "",
//             orderStatus: order.orderStatus || "",
//             customerName: order.Customer?.customer_first_name || "",
//             startDate,
//             endDate,
//             noOfDays: noOfDays !== null ? `${noOfDays} days` : "",
//             designer: latestDesigner,
//           };
//         }),
//       },
//     };
//   } catch (error) {
//     return {
//       status: statusCodes.INTERNAL_SERVER_ERROR,
//       data: {
//         message: "Failed to retrieve work in progress orders",
//         error: error.message,
//       },
//     };
//   }
// };
module.exports.workInProgress = async (req) => {
  try {
    // Validate and sanitize pagination parameters
    let page = parseInt(req.body.page) || 1;
    let pageSize = parseInt(req.body.pageSize) || 10;

    // Ensure positive values
    page = page > 0 ? page : 1;
    pageSize = pageSize > 0 ? pageSize : 10;

    // Cap pageSize to prevent excessive data fetching
    pageSize = Math.min(pageSize, 100);

    const offset = (page - 1) * pageSize;

    const { count, rows: orders } = await Order.findAndCountAll({
      attributes: ["id", "orderNo", "orderStatus", "customerId", "statusDate", "orderDate", "promiseDate"],
      where: {
        orderStatus: {
          [Op.in]: ["order", "sketch", "cad", "render", "design"], // Filter for work-in-progress statuses
        },
      },
      include: [
        {
          model: Customer,
          attributes: ["customer_first_name"],
          required: false,
        },
        {
          model: Task,
          attributes: ["taskId", "createdAt"],
          include: [
            {
              model: User,
              attributes: ["name"],
              required: false,
            },
          ],
          required: false,
        },
        {
          model: Sketch,
          attributes: ["sketchBriefDate", "sketchCompletedDate"],
          required: false,
          where: {
            orderId: { [Op.col]: "Order.id" }, // Use orderId instead of orderNo
          },
        },
        {
          model: Cad,
          attributes: ["cadBriefDate", "cadCompletedDate"],
          required: false,
          where: {
            orderId: { [Op.col]: "Order.id" }, // Use orderId instead of orderNo
          },
        },
        {
          model: Render,
          attributes: ["renderBriefDate", "renderCompletedDate"],
          required: false,
          where: {
            orderId: { [Op.col]: "Order.id" }, // Use orderId instead of orderNo
          },
        },
        {
          model: Design,
          attributes: ["createdAt"],
          required: false,
          where: {
            orderId: { [Op.col]: "Order.id" }, // Use orderId instead of orderNo
          },
        },
      ],
      limit: pageSize,
      offset: offset,
      distinct: true, // Ensure unique order counts
    });

    return {
      status: statusCodes.SUCCESS,
      data: {
        message: "Work in progress orders retrieved successfully",
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / pageSize),
        data: orders.map((order) => {
          const statusDate = order.statusDate ? new Date(order.statusDate) : null;
          const currentDate = new Date();

          // Calculate difference in days between status date and current date
          const noOfDays = statusDate
            ? Math.floor((currentDate - statusDate) / (1000 * 60 * 60 * 24))
            : null;

          // Determine start and end dates based on orderStatus
          let startDate = "";
          let endDate = "";

          switch (order.orderStatus) {
            case "order":
              startDate = order.orderDate
                ? new Date(order.orderDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = order.promiseDate
                ? new Date(order.promiseDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "sketch":
              startDate = order.Sketch?.sketchBriefDate
                ? new Date(order.Sketch.sketchBriefDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null
                
              endDate = order.Sketch?.sketchCompletedDate
                ? new Date(order.Sketch.sketchCompletedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "cad":
              startDate = order.Cad?.cadBriefDate
                ? new Date(order.Cad.cadBriefDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null
               
              endDate = order.Cad?.cadCompletedDate
                ? new Date(order.Cad.cadCompletedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "render":
              startDate = order.Render?.renderBriefDate
                ? new Date(order.Render.renderBriefDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null
                
              endDate = order.Render?.renderCompletedDate
                ? new Date(order.Render.renderCompletedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "design":
              startDate = order.Design?.createdAt
                ? new Date(order.Design.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : order.statusDate
                ? new Date(order.statusDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = "";
              break;
            default:
              startDate = "";
              endDate = "";
          }

          // Select the latest designer based on the Otoha the most recent task
          const latestDesigner = (order.Tasks || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.User?.name || "";

          return {
            taskNo: order.Tasks?.[0]?.taskId || "",
            orderNo: order.orderNo || "",
            orderStatus: order.orderStatus || "",
            customerName: order.Customer?.customer_first_name || "",
            startDate,
            endDate,
            noOfDays: noOfDays !== null ? `${noOfDays} days` : "",
            designer: latestDesigner,
          };
        }),
      },
    };
  } catch (error) {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      data: {
        message: "Failed to retrieve work in progress orders",
        error: error.message,
      },
    };
  }
};
module.exports.searchWorkInProgress = async (req) => {
  try {
    const { orderStatus, customerName, startDate, endDate, designer, orderNo } = req.body;

    // Build where clauses
    const orderWhereClause = {
      orderStatus: {
        [Op.in]: ["order", "sketch", "cad", "render", "design"], // Filter for work-in-progress statuses
      },
    };
    if (orderStatus) {
      orderWhereClause.orderStatus = { [Op.eq]: orderStatus };
    }
    if (orderNo) {
      orderWhereClause.orderNo = { [Op.iLike]: `%${orderNo}%` }; // Case-insensitive search
    }

    const customerWhereClause = {};
    if (customerName) {
      customerWhereClause.customer_first_name = { [Op.iLike]: `%${customerName}%` }; // Case-insensitive search
    }

    const userWhereClause = {};
    if (designer) {
      userWhereClause.name = { [Op.iLike]: `%${designer}%` }; // Case-insensitive search
    }

    // Build date filter based on the appropriate model's date fields
    const dateWhereClause = {};
    if (startDate && endDate) {
      dateWhereClause[Op.or] = [
        {
          orderStatus: "order",
          orderDate: {
            [Op.between]: [
              new Date(`${startDate}T00:00:00.000Z`),
              new Date(`${endDate}T23:59:59.999Z`),
            ],
          },
        },
        {
          orderStatus: "sketch",
          "$Sketch.sketchBriefDate$": {
            [Op.between]: [
              new Date(`${startDate}T00:00:00.000Z`),
              new Date(`${endDate}T23:59:59.999Z`),
            ],
          },
        },
        {
          orderStatus: "cad",
          "$Cad.cadBriefDate$": {
            [Op.between]: [
              new Date(`${startDate}T00:00:00.000Z`),
              new Date(`${endDate}T23:59:59.999Z`),
            ],
          },
        },
        {
          orderStatus: "render",
          "$Render.renderBriefDate$": {
            [Op.between]: [
              new Date(`${startDate}T00:00:00.000Z`),
              new Date(`${endDate}T23:59:59.999Z`),
            ],
          },
        },
        {
          orderStatus: "design",
          "$Design.createdAt$": {
            [Op.between]: [
              new Date(`${startDate}T00:00:00.000Z`),
              new Date(`${endDate}T23:59:59.999Z`),
            ],
          },
        },
      ];
    } else if (startDate) {
      dateWhereClause[Op.or] = [
        { orderStatus: "order", orderDate: { [Op.gte]: new Date(`${startDate}T00:00:00.000Z`) } },
        { orderStatus: "sketch", "$Sketch.sketchBriefDate$": { [Op.gte]: new Date(`${startDate}T00:00:00.000Z`) } },
        { orderStatus: "cad", "$Cad.cadBriefDate$": { [Op.gte]: new Date(`${startDate}T00:00:00.000Z`) } },
        { orderStatus: "render", "$Render.renderBriefDate$": { [Op.gte]: new Date(`${startDate}T00:00:00.000Z`) } },
        { orderStatus: "design", "$Design.createdAt$": { [Op.gte]: new Date(`${startDate}T00:00:00.000Z`) } },
      ];
    } else if (endDate) {
      dateWhereClause[Op.or] = [
        { orderStatus: "order", orderDate: { [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) } },
        { orderStatus: "sketch", "$Sketch.sketchBriefDate$": { [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) } },
        { orderStatus: "cad", "$Cad.cadBriefDate$": { [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) } },
        { orderStatus: "render", "$Render.renderBriefDate$": { [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) } },
        { orderStatus: "design", "$Design.createdAt$": { [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) } },
      ];
    }

    // Query orders with all filters
    const { count, rows: orders } = await Order.findAndCountAll({
      attributes: ["orderNo", "orderStatus", "customerId", "statusDate", "orderDate", "promiseDate"],
      where: { ...orderWhereClause, ...dateWhereClause },
      include: [
        {
          model: Customer,
          attributes: ["customer_first_name"],
          where: customerWhereClause,
          required: customerName ? true : false,
        },
        {
          model: Task,
          attributes: ["taskId"],
          include: [
            {
              model: User,
              attributes: ["name"],
              where: userWhereClause,
              required: designer ? true : false,
            },
          ],
          required: designer ? true : false,
        },
        {
          model: Sketch,
          attributes: ["sketchBriefDate", "sketchCompletedDate"],
          required: false,
        },
        {
          model: Cad,
          attributes: ["cadBriefDate", "cadCompletedDate"],
          required: false,
        },
        {
          model: Render,
          attributes: ["renderBriefDate", "renderCompletedDate"],
          required: false,
        },
        {
          model: Design,
          attributes: ["createdAt"],
          required: false,
        },
      ],
      order: [["statusDate", "DESC"]],
      distinct: true, // Ensure unique order counts
    });

    return {
      status: statusCodes.SUCCESS,
      data: {
        message: "Filtered work in progress orders retrieved successfully",
        totalRecords: count,
        data: orders.map((order) => {
          const statusDate = order.statusDate ? new Date(order.statusDate) : null;
          const currentDate = new Date();

          // Calculate difference in days between status date and current date
          const noOfDays =
            statusDate
              ? Math.floor((currentDate - statusDate) / (1000 * 60 * 60 * 24))
              : null;

          // Determine start and end dates based on orderStatus
          let startDate = "";
          let endDate = "";

          switch (order.orderStatus) {
            case "order":
              startDate = order.orderDate
                ? new Date(order.orderDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = order.promiseDate
                ? new Date(order.promiseDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "sketch":
              startDate = order.Sketch?.sketchBriefDate
                ? new Date(order.Sketch.sketchBriefDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = order.Sketch?.sketchCompletedDate
                ? new Date(order.Sketch.sketchCompletedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "cad":
              startDate = order.Cad?.cadBriefDate
                ? new Date(order.Cad.cadBriefDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = order.Cad?.cadCompletedDate
                ? new Date(order.Cad.cadCompletedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "render":
              startDate = order.Render?.renderBriefBriefDate
                ? new Date(order.Render.renderBriefDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = order.Render?.renderCompletedDate
                ? new Date(order.Render.renderCompletedDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              break;
            case "design":
              startDate = order.Design?.createdAt
                ? new Date(order.Design.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              endDate = "";
              break;
            default:
              startDate = "";
              endDate = "";
          }

          // Collect all designer names from tasks
          const designerNames = (order.Tasks || [])
            .map((task) => task.User?.name)
            .filter((name) => name)
            .join(", ") || "";

          return {
            taskNo: order.Tasks?.[0]?.taskId || "",
            orderNo: order.orderNo || "",
            orderStatus: order.orderStatus || "",
            customerName: order.Customer?.customer_first_name || "",
            startDate,
            endDate,
            noOfDays: noOfDays !== null ? `${noOfDays} days` : "",
            designer: designerNames,
          };
        }),
      },
    };
  } catch (error) {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      data: {
        message: "Failed to retrieve filtered work in progress orders",
        error: error.message,
      },
    };
  }
};

module.exports.getTaskImagesByType = async (req) => {
  const { type } = req.body;
  let page = req.body.page ? req.body.page : 1;
  let limit = req.body.pageSize ? req.body.pageSize : 10;

  if (!type) {
    return {
      status: statusCodes.UNPROCESSED,
      data: {
        message: "type is required in the request body",
      },
    };
  }

  const whereCondition = {};
  if (type) whereCondition.type = type;
  const offset = (page - 1) * limit;
  const { count, rows } = await Task.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: Sketch,
        attributes: ["status", "sketchNo"],
        include: [
          {
            model: Order,
            attributes: ["orderNo"],
          },
        ],
      },
      {
        model: Cad,
        attributes: ["status", "cadNo"],
        include: [
          {
            model: Order,
            attributes: ["orderNo"],
          },
        ],
      },
      {
        model: Render,
        attributes: ["status", "renderNo"],
        include: [
          {
            model: Order,
            attributes: ["orderNo"],
          },
        ],
      },
    ],
    limit,
    offset,
    //distinct: true,
    order: [["id", "DESC"]],
  });
  // Format response and append AWS URL to image fields
  const updatedTasks = rows
    .map((task) => {
      const imageUrls =
        task.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`) ||
        [];

      return {
        id: task.id,
        taskId: task.taskId,
        sketchId: task.sketchId,
        cadId: task.cadId,
        renderId: task.renderId,
        type: task.type,
        imageUrls,
        isApprovedCustomer: task.isApprovedCustomer,
        isApprovedOwn: task.isApprovedOwn,
        createdAt: moment(task.createdAt).format("DD MMM YYYY"),
        sketchStatus: task.Sketch?.status || null,
        cadStatus: task.Cad?.status || null,
        renderStatus: task.Render?.status || null,
        sketchNo: task.Sketch?.sketchNo || null,
        cadNo: task.Cad?.cadNo || null,
        renderNo: task.Render?.renderNo || null,
      };
    })
    // Filter out tasks where imageUrls is empty
    //.filter((task) => task.imageUrls && task.imageUrls.length > 0);
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Tasks retrieved successfully",
      totalRecords: count, // Update totalRecords to reflect filtered count
      totalPages: Math.ceil(count / limit), // Update totalPages accordingly
      currentPage: page,
      data: updatedTasks,
    },
  };
};

module.exports.searchTaskImagesByType = async (req) => {
  const { type, status, sketchNo, cadNo, renderNo } = req.body;
  let page = req.body.page ? req.body.page : 1;
  let limit = req.body.pageSize ? req.body.pageSize : 10;

  if (!type) {
    return {
      status: statusCodes.UNPROCESSED,
      data: {
        message: "Type is required",
      },
    };
  }

  const whereCondition = {};
  let sketch, cad, render;
  if (sketchNo || (status&&type=='sketch')) {
    let sketchCondition = {};

    if (sketchNo) {
      let normalizedSketchNo = sketchNo.toUpperCase();
      if (!normalizedSketchNo.startsWith("SK")) {
        normalizedSketchNo = `SK${normalizedSketchNo}`;
      }
      sketchCondition.sketchNo = normalizedSketchNo;
    }

    if (status) sketchCondition.status = status;
    sketch = await Sketch.findAll({
      where: sketchCondition,
    });

    if (sketch && sketch.length > 0) {
      whereCondition.sketchId = sketch.map((sketch) => sketch.id); // Array of sketch IDs
    }
  }
  if (cadNo || (status&&type=='cad')) {
    let cadCondition = {};
    if (cadNo) {      
      let normalizedCadNo = cadNo.toUpperCase();
      if (!normalizedCadNo.startsWith("CAD")) {
        normalizedCadNo = `CAD${normalizedCadNo}`;
      }
      cadCondition.cadNo = normalizedCadNo;
    }

    if (status) cadCondition.status = status;
    cad = await Cad.findAll({
      where: cadCondition,
    });

    if (cad && cad.length > 0) {
      whereCondition.cadId = cad.map((cad) => cad.id); // Array of cad IDs
    }
  }
  if (renderNo || (type=='render')) {
    let renderCondition = {};

    if (renderNo) {
      let normalizedRenderNo = renderNo.toUpperCase();
      if (!normalizedRenderNo.startsWith("R-")) {
        normalizedRenderNo = `R-${normalizedRenderNo}`;
      }
      renderCondition.renderNo = normalizedRenderNo;
    }

    if (status) renderCondition.status = status;
    render = await Render.findAll({
      where: renderCondition,
    });

    if (render && render.length > 0) {
      whereCondition.renderId = render.map((render) => render.id); // Array of sketch IDs
    }
  }
  let updatedTasks = [];
  if (
    (sketch && sketch.length) ||
    (cad && cad.length) ||
    (render && render.length)
  ) {
    let sketchIds = [];
    if (type) whereCondition.type = type;
    const offset = (page - 1) * limit;
    const { count, rows } = await Task.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Sketch,
          attributes: ["status", "sketchNo"],
          include: [
            {
              model: Order,
              attributes: ["orderNo"],
            },
          ],
        },
        {
          model: Cad,
          attributes: ["status", "cadNo"],
          include: [
            {
              model: Order,
              attributes: ["orderNo"],
            },
          ],
        },
        {
          model: Render,
          attributes: ["status", "renderNo"],
          include: [
            {
              model: Order,
              attributes: ["orderNo"],
            },
          ],
        },
      ],
      // limit,
      //offset,
      distinct: true,
      order: [["id", "DESC"]],
    });

    // Format response and append AWS URL to image fields
    updatedTasks = rows
      .map((task) => {
        const imageUrls =
          task.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`) ||
          [];

        return {
          id: task.id,
          taskId: task.taskId,
          sketchId: task.sketchId,
          cadId: task.cadId,
          renderId: task.renderId,
          type: task.type,
          imageUrls,
          isApprovedCustomer: task.isApprovedCustomer,
          isApprovedOwn: task.isApprovedOwn,
          createdAt: moment(task.createdAt).format("DD MMM YYYY"),
          sketchStatus: task.Sketch?.status || null,
          cadStatus: task.Cad?.status || null,
          renderStatus: task.Render?.status || null,
          sketchNo: task.Sketch?.sketchNo || null,
          cadNo: task.Cad?.cadNo || null,
          renderNo: task.Render?.renderNo || null,
        };
      })
      // Filter out tasks where imageUrls is empty
      //.filter((task) => task.imageUrls && task.imageUrls.length > 0);
  }
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Tasks retrieved successfully",
      // totalRecords: updatedTasks.length ? updatedTasks.length : 0, // Update totalRecords to reflect filtered count
      // totalPages: updatedTasks.length
      // ? Math.ceil(updatedTasks.length / limit)
      //  : 0, // Update totalPages accordingly
      // currentPage: updatedTasks.length ? page : 0,
      data: updatedTasks,
    },
  };
};

module.exports.getTasksByOrderIdOrType = async (req) => {
  const { orderId, type, id, page = 1, pageSize = 10 } = req.body;

  if (!orderId && !type) {
    return {
      status: statusCodes.UNPROCESSED,
      data: {
        message: "At least orderId or type is required in the request body",
      },
    };
  }

  const whereCondition = {};
  if (orderId) whereCondition.orderId = orderId;
  if (type) whereCondition.type = type;
  if (type === "sketch") whereCondition.sketchId = id;
  if (type === "cad") whereCondition.cadId = id;
  if (type === "render") whereCondition.renderId = id;
  console.log(whereCondition);

  // Calculate offset for pagination
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const tasks = await Task.findAll({
    where: whereCondition,
    include: [
      {
        model: User,
        attributes: ["name"], // Fetch only the name field
      },
      {
        model: Sketch,
        attributes: ["status", "sketchNo"], // Fetch the status field from Sketch
      },
      {
        model: Cad,
        attributes: ["status", "cadNo"], // Fetch the status field from CAD
      },
      {
        model: Render,
        attributes: ["status", "renderNo"], // Fetch the status field from Render
      },
    ],
    offset: offset, // Skip records based on page number
    limit: limit, // Limit the number of records returned
  });

  // Get total count for pagination metadata (optional)
  const totalTasks = await Task.count({ where: whereCondition });
  const totalPages = Math.ceil(totalTasks / pageSize);

  // Format response and append AWS URL to image fields
  const updatedTasks = tasks.map((task) => ({
    id: task.id,
    taskId: task.taskId,
    orderId: task.orderId,
    sketchId: task.sketchId,
    cadId: task.cadId,
    renderId: task.renderId,
    empId: task.empId,
    startDate: task.startDate
      ? new Date(task.startDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null,
    endDate: task.endDate
      ? new Date(task.endDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null,
    completedDate: task.completedDate
      ? new Date(task.completedDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null,
    selectedCount: task.selectedCount,
    type: task.type,
    imageUrls:
      task.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`) || [],
    selectedImageUrlsCustomer: task.selectedImageUrlsCustomer || [],
    selectedImageUrlsDew: task.selectedImageUrlsDew || [],
    reqCount: task.reqCount,
    isApprovedCustomer: task.isApprovedCustomer,
    isApprovedOwn: task.isApprovedOwn,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    name: task.User?.name || null,
    sketchStatus: task.Sketch?.status || null,
    cadStatus: task.Cad?.status || null,
    renderStatus: task.Render?.status || null,
    sketchNo: task.Sketch?.sketchNo || null,
    cadNo: task.Cad?.cadNo || null,
    renderNo: task.Render?.renderNo || null,
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      page: page,
      pageSize: pageSize,
      totalRecords: totalTasks,
      totalPages: totalPages,
      data: updatedTasks,     
    },
  };
};

//#endregion
