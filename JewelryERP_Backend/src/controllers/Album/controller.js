//#region imports
const { statusCodes } = require("../../utils/constants");
const { transporter } = require("../../Helper/mail/nodemailer");
let emailTemplate = require("../../utils/emailTemplate");
const Album = require("../../models/album/albums");
const Customer = require("../../models/customer/customer");
const moment = require("moment");
const Design = require("../../models/design/design");
const { Op } = require("sequelize");
const DesignSent = require("../../models/design/designSent");
//#endregion

//#region modules

module.exports.sendAlbum = async (data) => {
  const { to, subject, text } = data;

  const info = await transporter.sendMail({
    from: '"Dew Diamonds" <diamondsdews@gmail.com>',
    to,
    subject,
    text,
    replyTo: "no-reply@dewdiamondswebapp.com",
  });
  return { status: statusCodes.SUCCESS, data: { messageId: info.messageId } };
};

module.exports.createAlbum = async (req) => {
  const { customerId, imageUrls, albumName, designIds } = req.body;

  const awsImageUrls = imageUrls.map((url) =>
    url.replace(process.env.AWS_IMAGE_URL, "")
  );

  const newAlbum = await Album.create({
    customerId,
    imageUrls: awsImageUrls,
    albumName,
    designIds,
  });
  if (newAlbum)
    return {
      status: statusCodes.SUCCESS,
      data: newAlbum,
    };
  else
    return {
      status: statusCodes.UNPROCESSED,
      data: { message: "Cant create Album" },
    };
};

module.exports.getAllAlbum = async (req) => {
  const { page = 1, pageSize = 10 } = req.body;

  const offset = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Fetch unique customers with at least one album, with pagination
  const { count: totalUniqueCustomers, rows: customers } =
    await Customer.findAndCountAll({
      include: [
        {
          model: Album,
          as: "Albums",
          required: true, // Ensures only customers with albums are included
        },
      ],
      offset,
      limit,
      distinct: true,
      attributes: ["id", "customer_first_name", "customer_email"],
    });

  // Fetch all albums for the selected customers
  const customerIds = customers.map((c) => c.id);
  const albums = await Album.findAll({
    where: { customerId: customerIds }, // Assuming customerId is the foreign key in Album
    include: [
      {
        model: Customer,
        as: "Customer",
        attributes: ["id", "customer_first_name", "customer_email"],
      },
    ],
  });

  // Group albums by customer
  const groupedByCustomer = albums.reduce((acc, album) => {
    const customer = album.Customer || {
      id: null,
      customer_first_name: "Unknown",
      customer_email: "N/A",
    };
    const customerId = customer.id || "unknown";

    if (!acc[customerId]) {
      acc[customerId] = {
        customer: {
          id: customer.id,
          name: customer.customer_first_name,
          email: customer.customer_email,
        },
        albums: [],
        albumCount: 0,
        latestAlbumDate: null,
      };
    }

    acc[customerId].albums.push({
      id: album.id,
      albumNo: album.albumNo,
      albumName: album.albumName,
      imageUrls: album.imageUrls,
      designIds: album.designIds,
      isAlbumSent: album.isAlbumSent,
      createdDate: moment(album.createdAt).format("DD MMM YYYY"),
    });

    const albumDate = moment(album.createdAt);
    if (
      !acc[customerId].latestAlbumDate ||
      albumDate.isAfter(acc[customerId].latestAlbumDate)
    ) {
      acc[customerId].latestAlbumDate = albumDate;
    }

    acc[customerId].albumCount += 1;

    return acc;
  }, {});

  const result = Object.values(groupedByCustomer).map((group) => ({
    customerId: group.customer.id,
    customerName: group.customer.name,
    customerEmail: group.customer.email,
    albumCount: group.albumCount,
    latestAlbumOn: group.latestAlbumDate
      ? moment(group.latestAlbumDate).format("DD MMM YYYY")
      : "N/A",
  }));

  const totalRecords = totalUniqueCustomers;
  const totalPages = Math.ceil(totalRecords / pageSize);

  return {
    status: statusCodes.SUCCESS,
    data: {
      currentPage: parseInt(page),
      pageSize: limit,
      totalRecords,
      totalPages,
      albums: result,
    },
  };
};

module.exports.getAlbumsByCustomerId = async (
  customerId,
  page = 1,
  pageSize = 10
) => {
  // Calculate offset for pagination
  const offset = (page - 1) * pageSize;

  // Fetch albums with pagination for the given customerId, sorted by createdAt in descending order
  const albums = await Album.findAll({
    where: { customerId }, // Filter by customerId
    include: [
      {
        model: Customer,
        attributes: ["id", "customer_first_name", "customer_email"],
      },
    ],
    order: [["createdAt", "DESC"]], // Sort by createdAt in descending order
    limit: pageSize, // Limit number of results per page
    offset: offset, // Skip records based on page number
  });

  // Get total count for pagination info
  const totalCount = await Album.count({ where: { customerId } });

  // Map albums to the desired response format
  const result = albums.map((album) => ({
    id: album.id,
    albumNo: album.albumNo,
    albumName: album.albumName,
    imageUrls: album.imageUrls.map(
      (url) => `${process.env.AWS_IMAGE_URL}${url}`
    ),
    isAlbumSent: album.isAlbumSent,
    createdDate: moment(album.createdAt).format("DD MMM YYYY"),
    customer: {
      id: album.Customer?.id || null,
      name: album.Customer?.customer_first_name || "Unknown",
      email: album.Customer?.customer_email || "N/A",
    },
  }));

  return {
    data: {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      data: result,
    },
    status: statusCodes.SUCCESS,
  };
};

module.exports.sendAlbumByEmail = async (albumIds, designPageLink) => {
  // Convert to array if single ID is provided
  const albumIdArray = Array.isArray(albumIds) ? albumIds : [albumIds];
  // Fetch all albums in one query
  const albums = await Album.findAll({
    where: {
      id: { [Op.in]: albumIdArray },
      //isAlbumSent: false
    },
    include: [
      {
        model: Customer,
        attributes: ["id", "customer_first_name", "customer_email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  if (albums.length === 0) {
    return {
      status: statusCodes.UNPROCESSED,
      data: { message: "No valid albums found to send" },
    };
  }

  // Verify all albums belong to the same customer
  const customerId = albums[0].Customer.id;
  const allSameCustomer = albums.every(
    (album) => album.Customer.id === customerId
  );
  if (!allSameCustomer) {
    return {
      status: statusCodes.UNPROCESSED,
      data: { message: "Albums must belong to the same customer" },
    };
  }

  // Get all design IDs from all albums
  const allDesignIds = albums.flatMap((album) => album.designIds || []);

  // Fetch all designs in one query
  const designs = await Design.findAll({
    where: {
      id: { [Op.in]: allDesignIds },
    },
    order: [["createdAt", "DESC"]],
  });

  try {
    // Format all designs
    const designFormat = designs.map((design) => ({
      id: design.id,
      createdAt: moment(design.createdAt).format("DD MMM YYYY"),
      designNo: design.designNo,
      imageUrls: design.imageUrls.map(
        (url) => `${process.env.AWS_IMAGE_URL}/${url}`
      ),
      albumName: albums.find((album) => album.designIds.includes(design.id))
        .albumName,
    }));

    // Replace customer name in email template
    let currentEmailTemplate = emailTemplate.replace(
      "{{customer_first_name}}",
      albums[0].Customer.customer_first_name
    );

    // Create design list HTML with album grouping
    let designList = designFormat
      .map(
        (design) => `
        <p class="design">
            <strong>📅 Date: ${design.createdAt}</strong><br>
            🔹 Design Number: ${design.designNo}<br>
            🔹 Album Name: ${design.albumName}<br>
            ${
              design.imageUrls.length > 0
                ? `<img src="${design.imageUrls[0]}" width="200">`
                : ""
            }
        </p>
      `
      )
      .join("");

    currentEmailTemplate = currentEmailTemplate.replace(
      "{{designs}}",
      designList
    );
    currentEmailTemplate = currentEmailTemplate.replace(
      "{{design_page_link}}",
      designPageLink
    );

    // Send single email
    await transporter.sendMail({
      from: '"Dew Diamonds" <diamondsdews@gmail.com>',
      to: albums[0].Customer.customer_email,
      subject: "Your Custom Jewellery Designs Are Ready! 💎",
      html: currentEmailTemplate,
      replyTo: "no-reply@dewdiamondswebapp.com",
    });

    // Extract image URLs from designs
    const awsImageUrls = designs.flatMap((design) =>
      design.imageUrls.map((url) => url.replace(process.env.AWS_IMAGE_URL, ""))
    );

    // Create DesignSent records for all albums
    const designSentRecords = designs.map((design) => {
      const album = albums.find((a) => a.designIds.includes(design.id));
      return {
        designId: design.id,
        albumId: album.id,
        customerId: album.Customer.id,
        sentDate: new Date(),
        status: "Sent",
      };
    });

    await DesignSent.bulkCreate(designSentRecords);

    // Update all albums to mark them as sent
    await Album.update(
      { isAlbumSent: true },
      { where: { id: { [Op.in]: albumIdArray } } }
    );

    return {
      status: statusCodes.SUCCESS,
      data: {
        message: `Mail sent successfully with ${albums.length} albums`,
        albumIds: albumIdArray,
        designCount: designs.length,
      },
    };
  } catch (error) {
    return {
      status: statusCodes.ERROR,
      data: {
        message: `Failed to send mail: ${error.message}`,
        albumIds: albumIdArray,
      },
    };
  }
};

module.exports.getDesignsByAlbumId = async (albumId) => {
  const album = await Album.findOne({
    where: { id: albumId },
  });

  // If album exists and has designIds, fetch the designs
  if (album && album.designIds && album.designIds.length > 0) {
    const designs = await Design.findAll({
      where: {
        id: { [Op.in]: album.designIds }, // Filter designs by IDs in album.designIds
      },
      order: [["createdAt", "DESC"]], // Sort by createdAt in descending order
    });

    // Map designs to the desired format
    const result = designs.map((design) => ({
      id: design.id,
      designNo: design.designNo,
      imageUrls: design.imageUrls.map(
        (url) => `${process.env.AWS_IMAGE_URL}${url}`
      ), // Append AWS base URL
      createdAt: moment(design.createdAt).format("DD MMM YYYY"), // Format date as "DD MMM YYYY"
    }));

    return {
      status: statusCodes.SUCCESS,
      data: result,
    };
  } else {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Album not found or no designs associated" },
    };
  }
};

module.exports.searchAlbumsByCustomer = async (req) => {
  const { customerName = "", customerEmail = "" } = req.body;

  // Build where clause for customer search
  const customerWhere = {};
  if (customerName) {
    customerWhere.customer_first_name = {
      [Op.like]: `%${customerName}%`,
    };
  }
  if (customerEmail) {
    customerWhere.customer_email = {
      [Op.like]: `%${customerEmail}%`,
    };
  }

  // Fetch albums with customer filtering and pagination
  const { count, rows: albums } = await Album.findAndCountAll({
    include: [
      {
        model: Customer,
        as: "Customer",
        attributes: ["id", "customer_first_name", "customer_email"],
        where: customerWhere,
      },
    ],
    offset,
    limit,
  });

  // Group albums by customer
  const groupedByCustomer = albums.reduce((acc, album) => {
    const customer = album.Customer || {
      id: null,
      customer_first_name: "Unknown",
      customer_email: "N/A",
    };
    const customerId = customer.id || "unknown";

    if (!acc[customerId]) {
      acc[customerId] = {
        customer: {
          id: customer.id,
          name: customer.customer_first_name,
          email: customer.customer_email,
        },
        albums: [],
        albumCount: 0,
        latestAlbumDate: null,
      };
    }

    acc[customerId].albums.push({
      id: album.id,
      albumNo: album.albumNo,
      albumName: album.albumName,
      imageUrls: album.imageUrls,
      designIds: album.designIds,
      isAlbumSent: album.isAlbumSent,
      createdDate: moment(album.createdAt).format("DD MMM YYYY"),
    });

    const albumDate = moment(album.createdAt);
    if (
      !acc[customerId].latestAlbumDate ||
      albumDate.isAfter(acc[customerId].latestAlbumDate)
    ) {
      acc[customerId].latestAlbumDate = albumDate;
    }

    acc[customerId].albumCount += 1;

    return acc;
  }, {});

  // Convert grouped object to array and format the response
  const result = Object.values(groupedByCustomer).map((group) => ({
    customerId: group.customer.id,
    customerName: group.customer.name,
    customerEmail: group.customer.email,
    albumCount: group.albumCount,
    latestAlbumOn: group.latestAlbumDate
      ? moment(group.latestAlbumDate).format("DD MMM YYYY")
      : "N/A",
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      albums: result,
    },
  };
};

module.exports.searchAlbumsOfCustomer = async (req) => {
  const {
    customerId, // Now mandatory
    albumNo = "",
    albumName = "",
    isAlbumSent = false,
  } = req.body;

  // Validate customerId is provided
  if (!customerId) {
    return {
      status: statusCodes.ACCEPTABLE,
      data: {
        message: "customerId is required",
      },
    };
  }

  // Build where clause for album search
  const albumWhere = {
    customerId,
    isAlbumSent,
  };

  if (albumNo) {
    albumWhere.albumNo = {
      [Op.iLike]: `%${albumNo}%`,
    };
  }
  if (albumName) {
    albumWhere.albumName = {
      [Op.iLike]: `%${albumName}%`,
    };
  }

  // Fetch albums with customer filtering
  const albums = await Album.findAll({
    where: albumWhere,
    include: [
      {
        model: Customer,
        as: "Customer",
        attributes: ["id", "customer_first_name", "customer_email"],
      },
    ],
  });

  const result = albums.map((album) => ({
    id: album.id,
    albumNo: album.albumNo,
    albumName: album.albumName,
    imageUrls: album.imageUrls.map(
      (url) => `${process.env.AWS_IMAGE_URL}${url}`
    ),
    isAlbumSent: album.isAlbumSent,
    createdDate: moment(album.createdAt).format("DD MMM YYYY"),
    customer: {
      id: album.Customer?.id || null,
      name: album.Customer?.customer_first_name || "Unknown",
      email: album.Customer?.customer_email || "N/A",
    },
  }));

  return {
    status: statusCodes.SUCCESS,
    data: { data: result },
  };
};

//#endregion
