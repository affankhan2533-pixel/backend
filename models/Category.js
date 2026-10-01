import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
      index: true,
    },
    subcategories: {
      type: [SubcategorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Fallback id virtual to match frontend expectations
CategorySchema.virtual("categoryId").get(function () {
  return this.id || this._id.toString();
});

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
