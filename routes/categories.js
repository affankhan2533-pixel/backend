import express from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.route("/").get(getCategories).post(createCategory);
router.route("/:slug").get(getCategoryBySlug);
router.route("/:id").put(updateCategory).delete(deleteCategory);

export default router;
