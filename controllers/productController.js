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
    let imageUrl = null;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

    // Check if image was uploaded
    if (req.files && req.files.length > 0) {
      const file = req.files[0]; // Only take the first image
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ 
          message: `File ${file.originalname} exceeds 5MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        });
      }

      // Upload to Firebase
      imageUrl = await uploadToFirebase(file.buffer, file.originalname, file.mimetype);
    }

    // Attach URL to the database payload
    const productData = {
      ...req.body,
      images: imageUrl ? [imageUrl] : []
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

// @desc    Upload a single image for a product
// @route   POST /api/products/uploadImage/:id
// @access  Admin
export const uploadProductImage = async (req, res) => {
  try {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const file = req.file;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: `File ${file.originalname} exceeds 5MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Upload to Firebase
    const imageUrl = await uploadToFirebase(file.buffer, file.originalname, file.mimetype);

    // Get the product
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Add image to product's images array (max 5)
    const currentImages = product.images || [];
    if (currentImages.length >= 5) {
      return res.status(400).json({ message: "Product already has 5 images" });
    }

    currentImages.push(imageUrl);
    await product.update({ images: currentImages });

    res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      images: product.images
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
};

// @desc    Delete an image from a product
// @route   DELETE /api/products/deleteImage/:id
// @access  Admin
export const deleteProductImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove image from array
    const updatedImages = (product.images || []).filter(img => img !== imageUrl);
    await product.update({ images: updatedImages });

    res.json({
      message: "Image deleted successfully",
      images: updatedImages
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete image", error: error.message });
  }
};