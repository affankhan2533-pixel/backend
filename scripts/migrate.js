import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { connectDB, closeDB } from "../config/db.js";
import { REAL_PRODUCTS_CATALOG } from "../../gormenswear-frontend/lib/realProductsData.js";

dotenv.config();

const INITIAL_CATEGORIES = [
  {
    id: "cat-tshirts",
    name: "T-Shirts",
    slug: "t-shirts",
    description: "Everyday silhouettes, considered proportions, and luxury heavyweight knits.",
    image: "/images/categories/t-shirts/image copy 2.png",
    bannerImage: "/images/categories/t-shirts/banner.webp",
    displayOrder: 1,
    status: "Active",
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
    bannerImage: "/images/categories/shirts/banner.webp",
    displayOrder: 2,
    status: "Active",
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
    image: "/images/categories/t-shirts/image.png",
    bannerImage: "/images/categories/polos/banner.webp",
    displayOrder: 3,
    status: "Active",
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
    image: "/images/categories/pants/banner.webp",
    bannerImage: "/images/categories/pants/banner.webp",
    displayOrder: 4,
    status: "Active",
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
    image: "/images/lookbook/gor-lookbook-2.webp",
    bannerImage: "/images/lookbook/gor-lookbook-2.webp",
    displayOrder: 5,
    status: "Active",
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
    bannerImage: "/images/categories/jackets/banner.webp",
    displayOrder: 6,
    status: "Active",
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
    image: "/images/categories/jerseys/image.png",
    bannerImage: "/images/categories/jerseys/banner.webp",
    displayOrder: 7,
    status: "Active",
    subcategories: [
      { id: "sub-jerseys-football", name: "Football", slug: "football" },
      { id: "sub-jerseys-basketball", name: "Basketball", slug: "basketball" },
      { id: "sub-jerseys-graphic", name: "Graphic", slug: "graphic" },
    ],
  },
];

const LEGACY_PRODUCTS = [
  {
    id: "gor-tee-essential-oversized",
    name: "GOR Essential Oversized Tee",
    slug: "gor-essential-oversized-tee",
    categoryId: "cat-tshirts",
    category: "T-Shirts",
    categorySlug: "t-shirts",
    subcategoryId: "sub-tshirts-oversized",
    subcategory: "Oversized",
    subcategorySlug: "oversized",
    price: 1499,
    compareAtPrice: 1999,
    costPerItem: 650,
    stock: 48,
    minStockThreshold: 10,
    sku: "GOR-TEE-OVR-01",
    barcode: "89042109299",
    status: "Active",
    visibility: "Published",
    colors: ["Black", "White", "Green", "Navy"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    imageUrl: "/images/products/t-shirts/oversized/gor-essential-oversized-tee/black-01.webp",
    images: [
      "/images/products/t-shirts/oversized/gor-essential-oversized-tee/black-01.webp",
      "/images/products/t-shirts/oversized/gor-essential-oversized-tee/black-02.webp",
      "/images/products/t-shirts/oversized/gor-essential-oversized-tee/white-01.webp",
      "/images/products/t-shirts/oversized/gor-essential-oversized-tee/white-02.webp",
    ],
    description: "Signature 280 GSM luxury heavyweight combed cotton oversized tee. Featuring drop shoulders, tailored neck ribbing, and seamless drape.",
    tags: ["Oversized", "Heavyweight", "Streetwear", "Essential"],
  },
  {
    id: "gor-shirt-1",
    name: "GOR Designer Camp Shirting in Onyx",
    slug: "gor-designer-camp-shirting-onyx",
    categoryId: "cat-shirts",
    category: "Shirts",
    categorySlug: "shirts",
    subcategoryId: "sub-shirts-casual",
    subcategory: "Casual",
    subcategorySlug: "casual",
    price: 240,
    compareAtPrice: 280,
    costPerItem: 75,
    stock: 28,
    sku: "GOR-SHT-CMP-03",
    status: "Active",
    visibility: "Published",
    image: "/images/lookbook/gor-lookbook-2.webp",
    imageUrl: "/images/lookbook/gor-lookbook-2.webp",
    images: ["/images/lookbook/gor-lookbook-2.webp"],
    description: "Open camp collar shirt with mother-of-pearl buttons and relaxed boxy silhouette.",
    colors: ["Onyx"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "gor-trouser-1",
    name: "Structured Tailored Trousers in Charcoal",
    slug: "structured-tailored-trousers-charcoal",
    categoryId: "cat-trousers",
    category: "Trousers",
    categorySlug: "trousers",
    subcategoryId: "sub-trousers-pleated",
    subcategory: "Pleated",
    subcategorySlug: "pleated",
    price: 290,
    compareAtPrice: 340,
    costPerItem: 90,
    stock: 14,
    sku: "GOR-TRS-STR-04",
    status: "Active",
    visibility: "Published",
    image: "/images/lookbook/image copy 5.png",
    imageUrl: "/images/lookbook/image copy 5.png",
    images: ["/images/lookbook/image copy 5.png"],
    description: "Deep double-pleated trousers with side adjusters and clean tapered break.",
    colors: ["Charcoal"],
    sizes: ["30", "32"],
  },
  {
    id: "gor-codset-1",
    name: "GOR Alo Burgundy Heavyweight Co-Ord Set",
    slug: "gor-alo-burgundy-co-ord-set",
    categoryId: "cat-uncategorized",
    category: "Uncategorized",
    categorySlug: "uncategorized",
    price: 380,
    compareAtPrice: 450,
    costPerItem: 120,
    stock: 18,
    sku: "GOR-COD-ALO-01",
    status: "Active",
    visibility: "Published",
    image: "/images/products/gor-codset-burgundy-alo.webp",
    imageUrl: "/images/products/gor-codset-burgundy-alo.webp",
    images: ["/images/products/gor-codset-burgundy-alo.webp"],
    description: "Heavyweight Alo cotton blend co-ord set featuring structured shoulders and relaxed fit pants.",
    colors: ["Burgundy"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "gor-codset-2",
    name: "Prada Desert Sand Textured Zip Set",
    slug: "prada-desert-sand-zip-set",
    categoryId: "cat-uncategorized",
    category: "Uncategorized",
    categorySlug: "uncategorized",
    price: 520,
    compareAtPrice: 600,
    costPerItem: 180,
    stock: 4,
    sku: "GOR-COD-PRA-02",
    status: "Active",
    visibility: "Published",
    image: "/images/products/gor-codset-beige-prada.webp",
    imageUrl: "/images/products/gor-codset-beige-prada.webp",
    images: ["/images/products/gor-codset-beige-prada.webp"],
    description: "Textured desert sand zip shirt with matching relaxed trousers crafted from technical poly-cotton.",
    colors: ["Desert Sand"],
    sizes: ["M", "L"],
  },
];

export async function runMigration() {
  console.log("==================================================");
  console.log("GOR MENSWEAR — IDEMPOTENT MONGODB MIGRATION");
  console.log("==================================================");

  const connected = await connectDB();
  if (!connected) {
    console.error("❌ Failed to connect to MongoDB. Check MONGODB_URI.");
    process.exit(1);
  }
  const rawUri = process.env.MONGODB_URI || "";
  const isAtlas = rawUri.startsWith("mongodb+srv://") || rawUri.includes("mongodb.net");
  if (!isAtlas) {
    console.error("❌ Refusing to run migration: Connection is NOT MongoDB Atlas!");
    process.exit(1);
  }
  console.log("MongoDB Atlas connected successfully");
  console.log(`Database: ${mongoose.connection.name}`);

  // 1. Migrate Categories
  console.log("\n📦 Migrating Categories...");
  let categoriesCount = 0;
  for (const cat of INITIAL_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true, runValidators: true }
    );
    categoriesCount++;
    console.log(`  ✓ Category [${cat.name}] synced (slug: ${cat.slug})`);
  }

  // 2. Clear old legacy products from MongoDB
  console.log("\n🧹 Removing old legacy products from MongoDB...");
  const legacySlugs = LEGACY_PRODUCTS.map((p) => p.slug);
  const deleteResult = await Product.deleteMany({ slug: { $in: legacySlugs } });
  console.log(`  ✓ Removed ${deleteResult.deletedCount} legacy products from database.`);

  // 3. Migrate 35 Real Products
  console.log("\n👕 Migrating 35 Real Products...");
  let realCount = 0;
  for (const p of REAL_PRODUCTS_CATALOG) {
    const productPayload = {
      ...p,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      imageUrl: p.imageUrl || p.image,
      image: p.image || p.imageUrl,
      images: p.images && p.images.length > 0 ? p.images : [p.imageUrl || p.image],
      status: p.status || "Active",
      visibility: p.visibility || "Published",
      isActive: p.isActive !== undefined ? p.isActive : true,
    };

    await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: productPayload },
      { upsert: true, new: true, runValidators: true }
    );
    realCount++;
  }
  console.log(`  ✓ Successfully migrated ${realCount} real products.`);

  // 4. Verify Final Database Counts
  const totalProducts = await Product.countDocuments();
  const catAgg = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log("\n==================================================");
  console.log("FINAL DATABASE VERIFICATION");
  console.log("==================================================");
  console.log(`Total Categories in MongoDB: ${categoriesCount}`);
  console.log(`Total Products in MongoDB:   ${totalProducts}`);
  console.log("\nProduct counts by Category:");
  catAgg.forEach((c) => {
    console.log(`  - ${c._id || "Uncategorized"}: ${c.count}`);
  });
  console.log("==================================================");

  await closeDB();
  console.log("✅ Migration completed cleanly. MongoDB disconnected.");
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith("migrate.js")) {
  runMigration().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}
