import Product from "../models/Product.js";
import { Op } from "sequelize";
import { uploadToFirebase } from "../utils/firebaseUpload.js";

// CREATE PRODUCT (SuperAdmin only)
export const createProduct = async (req, res) => {
  try {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    let uploadedImages = [];
    // Handle multiple images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.size > MAX_FILE_SIZE) {
          return res.status(400).json({
            message: `File ${file.originalname} exceeds 5MB limit`,
          });
        }
        const imageUrl = await uploadToFirebase(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        uploadedImages.push(imageUrl);
      }
    }
    const product = await Product.create({
      ...req.body,
      images: uploadedImages,
    });
    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// GET ALL PRODUCTS FOR SUPERADMIN WITH PAGINATION
export const getAllProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { count, rows } = await Product.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return res.json({
      totalItems: count,
      products: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get Admin Products Error:", error);
    return res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// SUPERADMIN SEARCH PRODUCTS
export const getProductsSearchByStringAdmin = async (req, res) => {
  try {
    const { searchString } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: {
        productname: {
          [Op.like]: `%${searchString}%`,
        },
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      products: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to search products",
      error: error.message,
    });
  }
};

// UPDATE PRODUCT (SuperAdmin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Editable fields
    product.productname =
      req.body.productname || product.productname;

    product.slug =
      req.body.slug || product.slug;

    product.description =
      req.body.description || product.description;

    product.category =
      req.body.category || product.category;

    product.productprice =
      req.body.productprice ?? product.productprice;

    product.discountvalue =
      req.body.discountvalue ?? product.discountvalue;

    product.gstpercentage =
      req.body.gstpercentage ?? product.gstpercentage;

    product.hsncode =
      req.body.hsncode || product.hsncode;

    product.stock =
      req.body.stock ?? product.stock;

    product.unit =
      req.body.unit || product.unit;

    product.adminEarningValue =
      req.body.adminEarningValue ?? product.adminEarningValue;

    product.supervisorEarningValue =
      req.body.supervisorEarningValue ?? product.supervisorEarningValue;

    product.employeeEarningValue =
      req.body.employeeEarningValue ?? product.employeeEarningValue;

    await product.save();

    return res.json({
      message: "Product updated successfully",
      product,
    });

  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// UPLOAD PRODUCT IMAGE URL
export const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        message: "Image URL is required",
      });
    }

    const existingImages = product.images || [];

    if (existingImages.length >= 5) {
      return res.status(400).json({
        message: "Maximum 5 images allowed",
      });
    }

    existingImages.push(imageUrl);

    product.images = existingImages;

    await product.save();

    return res.json({
      message: "Image uploaded successfully",
      images: product.images,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

// DELETE PRODUCT IMAGE
export const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.images = (product.images || []).filter(
      (img) => img !== imageUrl
    );

    await product.save();

    return res.json({
      message: "Image deleted successfully",
      images: product.images,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete image",
      error: error.message,
    });
  }
};



// GET ALL PRODUCTS (Public)
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: [
        "id",
        "productname",
        "slug",
        "description",
        "images",
        "category",
        "productprice",
        "discountvalue",
        "sellingPrice",
        "gstpercentage",
        "hsncode",
        "stock",
        "unit",
        "rating",
        "totalReviews",
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// PUBLIC PRODUCT SEARCH (App)
export const getProductsSearchByString = async (req, res) => {
  try {
    const { searchString } = req.params;

    const products = await Product.findAll({
      where: {
        productname: {
          [Op.like]: `%${searchString}%`,
        },
      },
      attributes: [
        "id",
        "productname",
        "slug",
        "description",
        "images",
        "category",
        "productprice",
        "discountvalue",
        "sellingPrice",
        "gstpercentage",
        "hsncode",
        "stock",
        "unit",
        "rating",
        "totalReviews",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(products);

  } catch (error) {
    console.error("Product Search Error:", error);

    return res.status(500).json({
      message: "Failed to search products",
      error: error.message,
    });
  }
};

// GET PRODUCT DETAILS BY ID (Public)
export const getProductDetailsById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      attributes: [
        "id",
        "productname",
        "slug",
        "description",
        "images",
        "category",
        "productprice",
        "discountvalue",
        "sellingPrice",
        "gstpercentage",
        "hsncode",
        "stock",
        "unit",
        "rating",
        "totalReviews",
      ],
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json(product);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch product details",
      error: error.message,
    });
  }
};
