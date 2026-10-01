import express from "express";
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Specific routes first to prevent :id shadowing
router.get("/category/:slug", getProductsByCategory);
router.get("/slug/:slug", getProductBySlug);

// Standard collection and single resource routes
router.route("/").get(getProducts).post(createProduct);
router.route("/:id").get(getProductById).put(updateProduct).delete(deleteProduct);

export default router;
