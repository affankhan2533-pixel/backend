import Category from "../models/Category.js";

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

const DEFAULT_CATEGORIES = [
  {
    id: "cat-tshirts",
    name: "T-Shirts",
    slug: "t-shirts",
    description: "Everyday silhouettes, considered proportions, and luxury heavyweight knits.",
    image: "/images/categories/t-shirts/image copy 21.png",
    displayOrder: 1,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-tshirts-oversized", name: "Oversized", slug: "oversized" },
      { id: "sub-tshirts-regular", name: "Regular Fit", slug: "regular-fit" },
      { id: "sub-tshirts-graphic", name: "Graphic / Printed", slug: "graphic" },
      { id: "sub-tshirts-basic", name: "Basic / Essential", slug: "basic" },
      { id: "sub-tshirts-fullsleeve", name: "Full Sleeve", slug: "full-sleeve" },
    ],
  },
  {
    id: "cat-shirts",
    name: "Shirts",
    slug: "shirts",
    description: "Textured weaves, architectural collars, and tailored cuts.",
    image: "/images/categories/shirts/image.png",
    displayOrder: 2,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-shirts-casual", name: "Casual", slug: "casual" },
      { id: "sub-shirts-formal", name: "Formal", slug: "formal" },
      { id: "sub-shirts-linen", name: "Linen", slug: "linen" },
      { id: "sub-shirts-overshirts", name: "Overshirts", slug: "overshirts" },
    ],
  },
  {
    id: "cat-polos",
    name: "Polos",
    slug: "polos",
    description: "Elevated knitwear, ribbed collars, and refined casualwear.",
    image: "/images/categories/t-shirts/image copy 18.png",
    displayOrder: 3,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-polos-basic", name: "Basic", slug: "basic" },
      { id: "sub-polos-premium", name: "Premium", slug: "premium" },
      { id: "sub-polos-graphic", name: "Graphic", slug: "graphic" },
    ],
  },
  {
    id: "cat-pants",
    name: "Pants",
    slug: "pants",
    description: "Utilitarian cargo silhouettes, relaxed twill, and structured trousers.",
    image: "/images/lookbook/image copy 3.png",
    displayOrder: 4,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-pants-cargo", name: "Cargo", slug: "cargo" },
      { id: "sub-pants-relaxed", name: "Relaxed", slug: "relaxed" },
      { id: "sub-pants-joggers", name: "Joggers", slug: "joggers" },
      { id: "sub-pants-casual", name: "Casual", slug: "casual" },
    ],
  },
  {
    id: "cat-trousers",
    name: "Trousers",
    slug: "trousers",
    description: "Sartorial pleats, fluid drape, and clean tapered breaks.",
    image: "/images/lookbook/image copy 5.png",
    displayOrder: 5,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-trousers-pleated", name: "Pleated", slug: "pleated" },
      { id: "sub-trousers-straight", name: "Straight Fit", slug: "straight-fit" },
      { id: "sub-trousers-relaxed", name: "Relaxed Fit", slug: "relaxed-fit" },
      { id: "sub-trousers-tailored", name: "Tailored", slug: "tailored" },
    ],
  },
  {
    id: "cat-jackets",
    name: "Jackets",
    slug: "jackets",
    description: "Structured bombers, unlined transitional jackets, and outerwear.",
    image: "/images/categories/t-shirts/image copy 19.png",
    displayOrder: 6,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-jackets-bomber", name: "Bomber", slug: "bomber" },
      { id: "sub-jackets-puffer", name: "Puffer", slug: "puffer" },
      { id: "sub-jackets-denim", name: "Denim", slug: "denim" },
      { id: "sub-jackets-lightweight", name: "Lightweight", slug: "lightweight" },
    ],
  },
  {
    id: "cat-jerseys",
    name: "Jerseys",
    slug: "jerseys",
    description: "Athletic mesh silhouettes, collegiate graphics, and modern streetwear.",
    image: "/images/categories/jerseys/image copy 8.png",
    displayOrder: 7,
    status: "Active",
    isActive: true,
    subcategories: [
      { id: "sub-jerseys-football", name: "Football", slug: "football" },
      { id: "sub-jerseys-basketball", name: "Basketball", slug: "basketball" },
      { id: "sub-jerseys-graphic", name: "Graphic", slug: "graphic" },
    ],
  },
];

// GET /api/categories
export const getCategories = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    let categories = [];
    try {
      categories = await Category.find(query).sort({ displayOrder: 1, name: 1 }).lean();
    } catch (dbErr) {
      console.warn("MongoDB Category.find error, using defaults:", dbErr.message);
    }

    if (!categories || categories.length === 0) {
      categories = DEFAULT_CATEGORIES;
    }

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
      data: categories,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      count: DEFAULT_CATEGORIES.length,
      categories: DEFAULT_CATEGORIES,
      data: DEFAULT_CATEGORIES,
    });
  }
};

// GET /api/categories/:slug
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const clean = String(slug || "").toLowerCase().trim();

    let category = null;
    try {
      category = await Category.findOne({
        $or: [
          { slug: clean },
          { id: clean },
          { id: `cat-${clean}` },
        ],
      }).lean();
    } catch (dbErr) {}

    if (!category) {
      category = DEFAULT_CATEGORIES.find(
        (c) => c.slug === clean || c.id === clean || c.id === `cat-${clean}`
      );
    }

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      category,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
export const createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }
    if (!data.id) {
      data.id = `cat-${data.slug}`;
    }

    const category = await Category.create(data);
    return res.status(201).json({
      success: true,
      category,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.name && !updates.slug) {
      updates.slug = generateSlug(updates.name);
    }

    const category = await Category.findOneAndUpdate(
      {
        $or: [
          { id },
          { slug: id.toLowerCase() },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        ],
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      category,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOneAndDelete({
      $or: [
        { id },
        { slug: id.toLowerCase() },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
