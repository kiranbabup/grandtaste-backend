import { Cart, CartItem } from "../models/Cart.js";
import Product from "../models/Product.js";

// ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const { productId, qty: rawQty } = req.body;
    const userId = req.user.id;

    // 1. Ensure qty is a valid number (prevents string concatenation issues)
    const qty = parseInt(rawQty);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        message: "Valid productId and a positive qty are required",
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // GST CALCULATIONS
    const sellingPrice = parseFloat(product.sellingPrice);
    const gst = parseFloat(product.gstpercentage);
    const basePrice = (sellingPrice * 100) / (100 + gst);
    const sellingPriceGst = sellingPrice - basePrice;

    // Find or create cart
    let [cart] = await Cart.findOrCreate({ where: { userId } });

    // Check existing item
    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      // NOTE: Here we ADD to the quantity. 
      // If you want to SET the quantity from a cart page, 
      // you could pass a flag like 'isUpdate: true' in req.body
      const newQty = existingItem.qty + qty;

      if (newQty > product.stock) {
        return res.status(400).json({ message: "Total quantity exceeds stock" });
      }

      // Update values and snapshots
      existingItem.qty = newQty;
      existingItem.productname = product.productname;
      existingItem.sellingPrice = product.sellingPrice;
      existingItem.sellingPriceGst = sellingPriceGst;
      existingItem.totalSellingPriceGst = sellingPriceGst * newQty;
      existingItem.stock = product.stock; // Update snapshot of stock

      // Update other snapshots as needed...
      existingItem.adminEarningValue = product.adminEarningValue;
      existingItem.supervisorEarningValue = product.supervisorEarningValue;
      existingItem.employeeEarningValue = product.employeeEarningValue;

      await existingItem.save();
    } else {
      if (qty > product.stock) {
        return res.status(400).json({ message: "Requested quantity exceeds stock" });
      }

      // Create new cart item with all snapshots
      await CartItem.create({
        cartId: cart.id,
        productId,
        qty,
        productname: product.productname,
        category: product.category,
        unit: product.unit,
        productprice: product.productprice,
        discountvalue: product.discountvalue,
        sellingPrice: product.sellingPrice,
        hsncode: product.hsncode,
        gstpercentage: product.gstpercentage,
        sellingPriceGst,
        totalSellingPriceGst: sellingPriceGst * qty,
        adminEarningValue: product.adminEarningValue,
        supervisorEarningValue: product.supervisorEarningValue,
        employeeEarningValue: product.employeeEarningValue,
        stock: product.stock
      });
    }

    // Fetch refreshed cart with latest totals
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: {
        model: CartItem,
        as: "items",
        include: { model: Product, as: "product" },
      },
    });

    let grandTotal = 0;
    let totalQty = 0;
    updatedCart.items.forEach((item) => {
      grandTotal += parseFloat(item.sellingPrice) * item.qty;
      totalQty += item.qty;
    });

    return res.json({
      ...updatedCart.toJSON(),
      grandTotal,
      totalQty,
      totalItems: updatedCart.items.length,
    });

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
      return res.json({ items: [], totalItems: 0, grandTotal: 0 });
    }

    let grandTotal = 0;
    let totalQty = 0;

    cart.items.forEach((item) => {
      grandTotal += parseFloat(item.sellingPrice) * item.qty;
      totalQty += item.qty;
    });

    return res.json({
      ...cart.toJSON(),
      grandTotal,
      totalQty,
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

    if (!updatedCart) {
      return res.json({ items: [], totalItems: 0, grandTotal: 0 });
    }

    let grandTotal = 0;
    let totalQty = 0;
    updatedCart.items.forEach((item) => {
      grandTotal += parseFloat(item.sellingPrice) * item.qty;
      totalQty += item.qty;
    });

    res.json({
      ...updatedCart.toJSON(),
      grandTotal,
      totalQty,
      totalItems: updatedCart.items.length,
    });
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