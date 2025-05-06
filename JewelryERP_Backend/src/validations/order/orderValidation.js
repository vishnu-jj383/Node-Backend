//#region headers
const Joi = require("joi");
//#endregion

//#region methods
module.exports.createOrderValidation = (orderModel) => {
  const schema = Joi.object({
    promiseDate: Joi.date().required(),
    orderDate: Joi.date().required(),
    requiredDesignCount: Joi.number().integer().required(),

    customerId: Joi.number().integer().required(),
    empId: Joi.number().integer(),
    productTypeId: Joi.number().integer().required(),
    genderId: Joi.number().integer().required(),
    categoryGroupId: Joi.number().integer().required(),
    categoryId: Joi.number().integer().allow(null),
    subcategoryId: Joi.number().integer().allow(null),
    brandId: Joi.number().integer().required(),
    styleId: Joi.number().integer().required(),
    occasionId: Joi.number().integer().required(),
    metalTypeId: Joi.number().integer().optional(),
    metalColorId: Joi.number().integer().optional(),

    status: Joi.string().valid("Pending", "Approved", "Rejected").default("Pending"),

    /* Uncomment these if Sketch and CAD Design references are needed
    sketchId: Joi.number().integer().optional(),
    cadId: Joi.number().integer().optional(),
    */

    expectedGrossWt: Joi.number().precision(2).optional(),
    expectedNetWt: Joi.number().precision(2).optional(),
    remarks: Joi.string().allow(null, "").optional(),

    diamondRange: Joi.string().optional(),
    colorStoneRange: Joi.string().optional(),
    priority: Joi.string().optional(),
    isItemReceived: Joi.string().optional(),
    isExclusive: Joi.boolean().optional(),
    title: Joi.string().optional(),
  });

  return schema.validate(orderModel);
};

//#endregion
