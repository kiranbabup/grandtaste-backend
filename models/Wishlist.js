import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";
import Product from "./Product.js";

const Wishlist = sequelize.define(
  "Wishlist",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One wishlist per user
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "wishlists",
  }
);

// Wishlist Items
const WishlistItem = sequelize.define(
  "WishlistItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    wishlistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Wishlist,
        key: "id",
      },
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "wishlist_items",

    indexes: [
      {
        unique: true,
        fields: ["wishlistId", "productId"], // Prevent duplicates
      },
    ],
  }
);

//
// =========================
// ASSOCIATIONS
// =========================
//

Wishlist.hasMany(WishlistItem, {
  foreignKey: "wishlistId",
  as: "items",
  onDelete: "CASCADE",
});

WishlistItem.belongsTo(Wishlist, {
  foreignKey: "wishlistId",
});

WishlistItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

Wishlist.belongsTo(User, {
  foreignKey: "userId",
});

export { Wishlist, WishlistItem };