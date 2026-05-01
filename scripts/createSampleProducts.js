// scripts/sampleProducts.js

import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";

const createSampleProducts = async () => {
  try {
    await connectDB();

    const sampleProducts = [
      {
        productname: "Water Bottle",
        slug: "water-bottle",
        description: "Fresh packaged drinking water bottle",
        images: [],
        category: "veg",
        productprice: 20,
        discountvalue: 1,
        sellingPrice: 19,
        gstpercentage: 0,
        hsncode: null,
        stock: 20,
        unit: "pcs",
        minOrderQty: 1,
        adminEarningValue: 1,
        supervisorEarningValue: 2,
        employeeEarningValue: 3,
        isAvailable: true,
        isFeatured: false,
        rating: 0,
        totalReviews: 0,
        tags: ["water", "bottle", "drinks"],
      },

      {
        productname: "Veg Masala Powder",
        slug: "veg-masala-powder",
        description: "Premium vegetable masala powder",
        images: [],
        category: "veg",
        productprice: 200,
        discountvalue: 10,
        sellingPrice: 190,
        gstpercentage: 0,
        hsncode: null,
        stock: 20,
        unit: "pcs",
        minOrderQty: 1,
        adminEarningValue: 3,
        supervisorEarningValue: 6,
        employeeEarningValue: 10,
        isAvailable: true,
        isFeatured: false,
        rating: 0,
        totalReviews: 0,
        tags: ["veg", "masala", "powder"],
      },

      {
        productname: "Veg Fry Powder",
        slug: "veg-fry-powder",
        description: "Special vegetable fry powder",
        images: [],
        category: "veg",
        productprice: 200,
        discountvalue: 10,
        sellingPrice: 190,
        gstpercentage: 0,
        hsncode: null,
        stock: 20,
        unit: "pcs",
        minOrderQty: 1,
        adminEarningValue: 3,
        supervisorEarningValue: 6,
        employeeEarningValue: 10,
        isAvailable: true,
        isFeatured: false,
        rating: 0,
        totalReviews: 0,
        tags: ["veg", "fry", "powder"],
      },
    ];

    for (const productData of sampleProducts) {
      const existingProduct = await Product.findOne({
        where: { slug: productData.slug },
      });

      if (!existingProduct) {
        await Product.create(productData);
        console.log(`${productData.productname} created`);
      } else {
        console.log(`${productData.productname} already exists`);
      }
    }

    console.log("Sample products creation completed");
    process.exit(0);

  } catch (error) {
    console.error("Failed to create sample products:", error);
    process.exit(1);
  }
};

createSampleProducts();