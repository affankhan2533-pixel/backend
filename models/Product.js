import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },
    compareAtPrice: {
      type: Number,
      default: null,
    },
    costPerItem: {
      type: Number,
      default: 0,
    },
    categoryId: {
      type: String,
      default: function () {
        if (!this) return "cat-uncategorized";
        const slug = this.categorySlug || (this.category ? this.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "uncategorized");
        return `cat-${slug}`;
      },
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      index: true,
    },
    categorySlug: {
      type: String,
      default: function () {
        if (!this) return "uncategorized";
        return this.category ? this.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "uncategorized";
      },
      trim: true,
      lowercase: true,
      index: true,
    },
    subcategoryId: {
      type: String,
      default: null,
      index: true,
    },
    subcategory: {
      type: String,
      default: "",
    },
    subcategorySlug: {
      type: String,
      default: "",
    },
    collectionId: {
      type: String,
      default: null,
    },
    collection: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    variants: {
      type: [VariantSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockThreshold: {
      type: Number,
      default: 5,
    },
    sku: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    barcode: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["Published", "Hidden"],
      default: "Published",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Import / origin metadata
    isImported: {
      type: Boolean,
      default: false,
      index: true,
    },
    countryOfOrigin: {
      type: String,
      default: "",
      trim: true,
    },
    fabric: {
      type: String,
      default: "",
      trim: true,
    },
    material: {
      type: String,
      default: "",
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
      default: 0,
    },
    wishlists: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to guarantee compatibility with frontend referencing .id
ProductSchema.virtual("productId").get(function () {
  return this.id || this._id.toString();
});

ProductSchema.pre("validate", function (next) {
  if (!this.id) {
    this.id = `prod_${Date.now()}`;
  }
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
  }
  if (!this.categorySlug && this.category) {
    this.categorySlug = this.category.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
  }
  if (!this.categoryId && this.categorySlug) {
    this.categoryId = `cat-${this.categorySlug}`;
  }
  next();
});

// Auto-sync images and image/imageUrl before save
ProductSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = `prod_${Date.now()}`;
  }
  if (!this.image && this.imageUrl) {
    this.image = this.imageUrl;
  }
  if (!this.imageUrl && this.image) {
    this.imageUrl = this.image;
  }
  if (!this.images || this.images.length === 0) {
    if (this.imageUrl) {
      this.images = [this.imageUrl];
    }
  }
  next();
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
