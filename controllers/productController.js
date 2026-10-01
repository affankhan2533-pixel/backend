import Product from "../models/Product.js";
import { REAL_PRODUCTS_CATALOG } from "../../gormenswear-frontend/lib/realProductsData.js";

// Helper to generate a clean URL slug
export function generateSlug(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      categorySlug,
      subcategory,
      search,
      minPrice,
      maxPrice,
      status,
      visibility,
      sort = "featured",
      page = 1,
      limit = 48,
      admin = "false",
    } = req.query;

    const query = {};
    const isAdmin = admin === "true";

    // Visibility / Status filters
    if (!isAdmin) {
      query.status = "Active";
      query.visibility = "Published";
    } else {
      if (status && status !== "all") query.status = status;
      if (visibility && visibility !== "all") query.visibility = visibility;
    }

    // Category filter at Database level
    const targetCat = categorySlug || category;
    if (targetCat && targetCat !== "all") {
      const catClean = targetCat.toLowerCase().trim();
      query.$or = [
        { categorySlug: catClean },
        { category: new RegExp(`^${catClean}$`, "i") },
        { categoryId: catClean },
        { categoryId: `cat-${catClean}` },
      ];
    }

    // Subcategory filter
    if (subcategory && subcategory !== "all") {
      const subClean = subcategory.toLowerCase().trim();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { subcategorySlug: subClean },
          { subcategory: new RegExp(`^${subClean}$`, "i") },
          { subcategoryId: subClean },
        ],
      });
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        ...(query.$or || []),
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    // Price filtering
    if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
      query.price = query.price || {};
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      query.price = query.price || {};
      query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "price-asc") sortOptions = { price: 1 };
    else if (sort === "price-desc") sortOptions = { price: -1 };
    else if (sort === "rating") sortOptions = { rating: -1, createdAt: -1 };
    else if (sort === "newest") sortOptions = { createdAt: -1 };
    else if (sort === "featured") sortOptions = { isFeatured: -1, createdAt: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 48;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: products,
      products,
    });
  } catch (error) {
    console.warn("MongoDB products fetch failed, returning real products fallback:", error.message);
    return res.status(200).json({
      success: true,
      count: REAL_PRODUCTS_CATALOG.length,
      total: REAL_PRODUCTS_CATALOG.length,
      page: 1,
      totalPages: 1,
      data: REAL_PRODUCTS_CATALOG,
      products: REAL_PRODUCTS_CATALOG,
    });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = await Product.findOne({ id }).lean();

    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).lean();
    }

    if (!product) {
      // Also try slug match if user passed a slug to :id endpoint
      product = await Product.findOne({ slug: id.toLowerCase() }).lean();
    }

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    return res.status(200).json({ success: true, product, data: product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/slug/:slug
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug: slug.toLowerCase() }).lean();

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    return res.status(200).json({ success: true, product, data: product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/category/:slug
// Must query MongoDB for products whose categorySlug matches
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const catSlug = slug.toLowerCase().trim();

    const query = {
      $or: [
        { categorySlug: catSlug },
        { categoryId: `cat-${catSlug}` },
        { categoryId: catSlug },
        { category: new RegExp(`^${catSlug}$`, "i") },
      ],
      status: "Active",
      visibility: "Published",
    };

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      categorySlug: catSlug,
      count: products.length,
      data: products,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (!data.id) {
      data.id = `prod_${Date.now()}`;
    }

    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }

    // Ensure price is numeric
    if (data.price !== undefined) {
      data.price = Number(data.price);
    }
    if (data.compareAtPrice !== undefined && data.compareAtPrice !== null && data.compareAtPrice !== "") {
      data.compareAtPrice = Number(data.compareAtPrice);
    }

    // Auto synchronize categorySlug and categoryId
    if (data.category && !data.categorySlug) {
      data.categorySlug = generateSlug(data.category);
    }
    if (!data.categoryId && (data.categorySlug || data.category)) {
      const slug = data.categorySlug || generateSlug(data.category);
      data.categoryId = `cat-${slug}`;
    }

    // Auto synchronize images
    if (!data.image && data.imageUrl) data.image = data.imageUrl;
    if (!data.imageUrl && data.image) data.imageUrl = data.image;
    if ((!data.images || data.images.length === 0) && data.imageUrl) {
      data.images = [data.imageUrl];
    }

    const product = await Product.create(data);
    return res.status(201).json({ success: true, product, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Format numbers
    if (updates.price !== undefined && updates.price !== null && updates.price !== "") {
      updates.price = Number(updates.price);
    }
    if (updates.compareAtPrice !== undefined && updates.compareAtPrice !== null && updates.compareAtPrice !== "") {
      updates.compareAtPrice = Number(updates.compareAtPrice);
    }
    if (updates.stock !== undefined) {
      updates.stock = parseInt(updates.stock, 10) || 0;
    }

    // Auto-update categorySlug if category changed
    if (updates.category && !updates.categorySlug) {
      updates.categorySlug = generateSlug(updates.category);
    }

    // Auto-sync images
    if (updates.imageUrl && (!updates.images || updates.images.length === 0)) {
      updates.images = [updates.imageUrl];
      updates.image = updates.imageUrl;
    }

    let product = await Product.findOneAndUpdate(
      { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    return res.status(200).json({ success: true, product, data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    if (hard === "true") {
      const deleted = await Product.findOneAndDelete({
        $or: [
          { id },
          { slug: id.toLowerCase() },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      });
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      return res.status(200).json({ success: true, message: "Product permanently deleted" });
    }

    // Soft delete: status = "Archived"
    const product = await Product.findOneAndUpdate(
      {
        $or: [
          { id },
          { slug: id.toLowerCase() },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      },
      { status: "Archived", visibility: "Hidden" },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    return res.status(200).json({ success: true, product, message: "Product archived successfully" });
  } catch (error) {
    next(error);
  }
};
