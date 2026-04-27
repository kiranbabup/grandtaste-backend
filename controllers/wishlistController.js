import { Wishlist, WishlistItem } from "../models/Wishlist.js";
import Product from "../models/Product.js";

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { userId: req.user.id },
      include: {
        model: WishlistItem,
        as: "items",
        include: {
          model: Product,
          as: "product",
        },
      },
    });

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wishlist", error: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    let wishlist = await Wishlist.findOne({ where: { userId } });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId });
    }

    const existingItem = await WishlistItem.findOne({
      where: { wishlistId: wishlist.id, productId },
    });

    if (!existingItem) {
      await WishlistItem.create({
        wishlistId: wishlist.id,
        productId,
      });
    }

    const updatedWishlist = await Wishlist.findOne({
      where: { id: wishlist.id },
      include: {
        model: WishlistItem,
        as: "items",
        include: {
          model: Product,
          as: "product",
        },
      },
    });

    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: "Failed to add to wishlist", error: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ where: { userId } });

    if (wishlist) {
      await WishlistItem.destroy({
        where: { wishlistId: wishlist.id, productId },
      });

      const updatedWishlist = await Wishlist.findOne({
        where: { id: wishlist.id },
        include: {
          model: WishlistItem,
          as: "items",
          include: {
            model: Product,
            as: "product",
          },
        },
      });

      res.json(updatedWishlist);
    } else {
      res.status(404).json({ message: "Wishlist not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to remove from wishlist", error: error.message });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ where: { userId: req.user.id } });
    if (wishlist) {
      await wishlist.destroy();
    }
    res.json({ message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear wishlist", error: error.message });
  }
};
