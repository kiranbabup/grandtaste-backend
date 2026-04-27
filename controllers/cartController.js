import { Cart, CartItem } from "../models/Cart.js";
import Product from "../models/Product.js";

export const getCart = async (req, res) => {
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

  res.json(cart);
};

export const addToCart = async (req, res) => {
  const { productId, qty } = req.body;
  const userId = req.user.id;

  let cart = await Cart.findOne({ where: { userId } });

  if (!cart) {
    cart = await Cart.create({ userId });
  }

  const existingItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
  });

  if (existingItem) {
    existingItem.qty += qty;
    await existingItem.save();
  } else {
    await CartItem.create({
      cartId: cart.id,
      productId,
      qty,
    });
  }

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