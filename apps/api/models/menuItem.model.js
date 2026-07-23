import { Schema, Model, menuTypes } from "#constants";

/**
 * MenuItem — the navigation, editable from the admin panel (we reshaped it many
 * times during the static build; it should not require code changes).
 *
 * A top-level item has `parent: null`. Children reference their parent; the API
 * assembles the tree. `location` lets one collection serve header, footer and
 * mobile menus.
 */
const menuItemSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, trim: true, default: "" },
    type: { type: String, enum: menuTypes, default: "link" },

    parent: { type: Schema.Types.ObjectId, ref: "MenuItem", default: null },
    location: {
      type: String,
      enum: ["header", "footer", "mobile"],
      default: "header",
    },
    // For mega menus: which column this child sits in
    column: { type: Number, default: 0 },
    icon: { type: String, trim: true },

    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } },
);

menuItemSchema.index({ location: 1, parent: 1, order: 1 });

menuItemSchema.virtual("children", {
  ref: "MenuItem",
  localField: "_id",
  foreignField: "parent",
});

/** Full menu tree for a location, ready to render. */
menuItemSchema.statics.tree = function (location = "header") {
  return this.find({ location, parent: null, isVisible: true })
    .sort({ order: 1 })
    .populate({
      path: "children",
      match: { isVisible: true },
      options: { sort: { order: 1 } },
    });
};

export const MenuItem = Model("MenuItem", menuItemSchema);
