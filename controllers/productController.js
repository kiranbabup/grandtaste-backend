import Product from "../models/Product.js";
import { Op } from "sequelize";
import { uploadToFirebase } from "../utils/firebaseUpload.js";

export const getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Product.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      products: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const imageUrls = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

    // Check if images were uploaded
    if (req.files && req.files.length > 0) {
      // Validate file sizes
      for (const file of req.files) {
        if (file.size > MAX_FILE_SIZE) {
          return res.status(400).json({ 
            message: `File ${file.originalname} exceeds 5MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
          });
        }
      }

      // Loop through buffers and upload to Firebase
      for (const file of req.files) {
        const url = await uploadToFirebase(file.buffer, file.originalname, file.mimetype);
        imageUrls.push(url);
      }
    }

    // Attach URLs to the database payload
    const productData = {
      ...req.body,
      images: imageUrls
    };

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (product) {
      await product.update(req.body);
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.destroy();
    res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Search products by productname
// @route   GET /api/products/getProductsSearchByString/:searchString
// @access  Public or Private
export const getProductsSearchByString = async (req, res) => {
  const searchString = req.params.searchString;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Product.findAndCountAll({
      where: {
        productname: {
          [Op.like]: `%${searchString}%`
        }
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      products: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};