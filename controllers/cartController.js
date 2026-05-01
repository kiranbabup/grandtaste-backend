import { Cart, CartItem } from "../models/Cart.js";
import Product from "../models/Product.js";

// ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const { productId, qty } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({
        message: "Valid productId and qty are required",
      });
    }

    // Fetch product
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        message: "Requested quantity exceeds stock",
      });
    }

    // GST CALCULATIONS (Inclusive GST)
    const sellingPrice = parseFloat(product.sellingPrice);
    const gst = parseFloat(product.gstpercentage);

    const basePrice = (sellingPrice * 100) / (100 + gst);
    const sellingPriceGst = sellingPrice - basePrice;
    const totalSellingPriceGst = sellingPriceGst * qty;

    // Find or create cart
    let cart = await Cart.findOne({
      where: { userId },
    });

    if (!cart) {
      cart = await Cart.create({
        userId,
      });
    }

    // Check existing cart item
    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      const newQty = existingItem.qty + qty;

      if (newQty > product.stock) {
        return res.status(400).json({
          message: "Total quantity exceeds stock",
        });
      }

      // Recalculate GST
      const updatedTotalSellingPriceGst = sellingPriceGst * newQty;

      existingItem.qty = newQty;

      // Update all snapshots
      existingItem.productname = product.productname;
      existingItem.category = product.category;
      existingItem.stock = product.stock;
      existingItem.unit = product.unit;

      existingItem.productprice = product.productprice;
      existingItem.discountvalue = product.discountvalue;
      existingItem.sellingPrice = product.sellingPrice;

      existingItem.hsncode = product.hsncode;
      
      existingItem.gstpercentage = product.gstpercentage;
      existingItem.sellingPriceGst = sellingPriceGst;
      existingItem.totalSellingPriceGst = updatedTotalSellingPriceGst;

      existingItem.adminEarningValue = product.adminEarningValue;
      existingItem.supervisorEarningValue = product.supervisorEarningValue;
      existingItem.employeeEarningValue = product.employeeEarningValue;

      await existingItem.save();

    } else {
      // Create new cart item
      await CartItem.create({
        cartId: cart.id,
        productId,
        qty,

        // Product snapshots
        productname: product.productname,
        category: product.category,
        stock: product.stock,
        unit: product.unit,

        // Pricing snapshots
        productprice: product.productprice,
        discountvalue: product.discountvalue,
        sellingPrice: product.sellingPrice,

        hsncode: product.hsncode,
        // GST snapshots
        gstpercentage: product.gstpercentage,
        sellingPriceGst,
        totalSellingPriceGst,

        // Earnings snapshots
        adminEarningValue: product.adminEarningValue,
        supervisorEarningValue: product.supervisorEarningValue,
        employeeEarningValue: product.employeeEarningValue,
      });
    }

    // Fetch updated cart
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: {
        model: CartItem,
        as: "items",
        include: {
          model: Product,
          as: "product",
        },
      },
    });

    return res.json(updatedCart);

  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      message: "Failed to add to cart",
      error: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: {
        model: CartItem,
        as: "items",
        include: {
          model: Product,
          as: "product",
        },
      },
    });

    if (!cart) {
      return res.json({
        items: [],
        totalItems: 0,
      });
    }

    let grandTotal = 0;

    cart.items.forEach((item) => {
      grandTotal += parseFloat(item.sellingPrice) * item.qty;
    });

    return res.json({
      ...cart.toJSON(),
      grandTotal,
      totalItems: cart.items.length,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const cart = await Cart.findOne({ where: { userId } });

  if (cart) {
    await CartItem.destroy({
      where: { cartId: cart.id, productId },
    });

    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: {
        model: CartItem,
        as: "items",
        include: {
          model: Product,
          as: "product",
        },
      },
    });

    res.json(updatedCart);
  } else {
    res.status(404).json({ message: "Cart not found" });
  }
};

export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (cart) {
    await cart.destroy();
  }
  res.json({ message: "Cart cleared" });
};