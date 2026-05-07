import { Wishlist, WishlistItem } from "../models/Wishlist.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/NotificationModel.js";

// UPDATED addToWishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId,
      });
    }

    const existingItem = await WishlistItem.findOne({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    if (!existingItem) {
      await WishlistItem.create({
        wishlistId: wishlist.id,
        productId,
      });
    }

    // STOCK ALERT ONLY TO SUPERADMIN
    if (product.stock <= 0) {
      const superAdmin = await User.findOne({
        where: {
          role: "superadmin",
        },
      });

      if (superAdmin) {
        await Notification.create({
          userId: superAdmin.id,
          title: "Wishlist Stock Alert",
          message: `${req.user.name} added out-of-stock product "${product.productname}" to wishlist.`,
          type: "alert",

          roleToDisplay: ["superadmin"],

          relatedId: product.id,
        });
      }
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

    return res.json(updatedWishlist);

  } catch (error) {
    console.error("Add To Wishlist Error:", error);

    return res.status(500).json({
      message: "Failed to add to wishlist",
      error: error.message,
    });
  }
};

// UPDATED getWishlist
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

    if (!wishlist) {
      return res.json({
        items: [],
        totalItems: 0,
      });
    }

    return res.json({
      ...wishlist.toJSON(),
      totalItems: wishlist.items.length,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    await WishlistItem.destroy({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
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

    return res.json(updatedWishlist);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove from wishlist",
      error: error.message,
    });
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

export const getWishlistDetails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await WishlistItem.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: Product,
          as: "product",
          where: { stock: 0 },
          attributes: ["productname", "sellingPrice", "id"],
        },
        {
          model: Wishlist,
          include: [
            {
              model: User,
              attributes: ["name", "phone"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true, // Crucial for correct count when using includes
    });

    const result = rows.map((item) => ({
      id: item.id,
      userName: item.Wishlist?.User?.name || "N/A",
      userPhone: item.Wishlist?.User?.phone || "N/A",
      productName: item.product?.productname || "N/A",
      sellingPrice: item.product?.sellingPrice || 0,
      createdAt: item.createdAt,
    }));

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
      data: result,
    });
  } catch (error) {
    console.error("Get Wishlist Details Error:", error);
    return res.status(500).json({
      message: "Failed to fetch wishlist details",
      error: error.message,
    });
  }
};


