import { redis } from "../lib/redis.js";
import fs from "fs/promises";
import Product from "../models/product.model.js";
import * as storage from "../lib/storage.js";
import url from "url";

async function updateFeaturedProductsCache() {
  const featuredProducts = await Product.find({ isFeatured: true }).lean();
  await redis.set(
    "featured_products",
    JSON.stringify(featuredProducts),
    "EX",
    3600
  );
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");

    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set(
      "featured_products",
      JSON.stringify(featuredProducts),
      "EX",
      3600
    ); // Cache for 1 hour

    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching featured products",
      error: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, isFeatured } = req.body;
    const image = req.file;

    let imageUrl = "";

    if (image) {
      imageUrl = await storage.uploadFile(image.path, "products");
      await fs.unlink(image.path);
    }

    if (isFeatured) {
      await updateFeaturedProductsCache();
    }

    const newProduct = await Product.create({
      name,
      description,
      price,
      image: imageUrl,
      category,
      isFeatured,
    });

    res
      .status(201)
      .json({ newProduct, message: "Product created successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const parsedUrl = url.parse(product.image);
      const pathname = parsedUrl.pathname.startsWith("/")
        ? parsedUrl.pathname.slice(1)
        : parsedUrl.pathname;

      const [bucket, ...objectParts] = pathname.split("/");
      const objectName = objectParts.join("/");

      if (bucket && objectName) {
        try {
          await storage.deleteFile(bucket, objectName);
          console.log(`🗑️ Deleted image ${objectName} from bucket ${bucket}`);
        } catch (err) {
          console.error(
            "Failed to delete product image from storage:",
            err.message
          );
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: `Product ${product.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 3 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          image: 1,
        },
      },
    ]);
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching recommended products",
      error: error.message,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();

    res.json({
      message: "Product featured status updated",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error toggling featured product",
      error: error.message,
    });
  }
};
