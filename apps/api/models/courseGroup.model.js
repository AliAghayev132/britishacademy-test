import {
  Schema,
  Model,
  cefrLevels,
  lessonFormats,
  timeSlots,
  groupStatus,
} from "#constants";

/**
 * CourseGroup — the timetable ("dərs qrafiki").
 *
 * This is the join that answers "which teacher runs which course, at which
 * branch, on which days and at what time". The site uses it for the schedule
 * page and for the "who teaches here" chips on the course price cards.
 */
const slotSchema = new Schema(
  {
    // 1 = Monday ... 7 = Sunday
    weekday: { type: Number, required: true, min: 1, max: 7 },
    from: { type: String, required: true, trim: true }, // "19:00"
    to: { type: String, required: true, trim: true }, // "20:30"
  },
  { _id: false },
);

const courseGroupSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },

    // Human-friendly group code, e.g. "ENG-B1-AXŞAM-01"
    code: { type: String, trim: true },

    level: { type: String, enum: cefrLevels },
    format: { type: String, enum: lessonFormats, default: "group" },
    // Derived from the first slot's start time, but stored so pricing lookups
    // and filtering stay trivial.
    timeSlot: { type: String, enum: timeSlots, default: "day" },

    schedule: { type: [slotSchema], default: [] },

    startDate: { type: Date },
    endDate: { type: Date },

    capacity: { type: Number, default: 6, min: 1 },
    enrolled: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: groupStatus, default: "open" },
    // Overrides the course price matrix for this specific group
    priceOverride: { type: Number, min: 0 },

    note: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Most common query: open groups for a course at a branch.
courseGroupSchema.index({ course: 1, branch: 1, status: 1 });
courseGroupSchema.index({ teacher: 1, status: 1 });

courseGroupSchema.virtual("seatsLeft").get(function () {
  return Math.max(0, (this.capacity || 0) - (this.enrolled || 0));
});

courseGroupSchema.virtual("isFull").get(function () {
  return (this.enrolled || 0) >= (this.capacity || 0);
});

/** Keep timeSlot and status consistent with the data. */
courseGroupSchema.pre("save", function (next) {
  const first = this.schedule?.[0]?.from;
  if (first) {
    const hour = parseInt(String(first).split(":")[0], 10);
    if (!Number.isNaN(hour)) this.timeSlot = hour >= 17 ? "evening" : "day";
  }
  if (this.status === "open" && this.capacity && this.enrolled >= this.capacity) {
    this.status = "full";
  }
  next();
});

courseGroupSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    startDate: 1,
  });
};

/** Distinct teachers running a course at a given branch. */
courseGroupSchema.statics.teachersFor = function (courseId, branchId) {
  return this.find({
    course: courseId,
    branch: branchId,
    isActive: true,
    isDeleted: false,
  }).distinct("teacher");
};

export const CourseGroup = Model("CourseGroup", courseGroupSchema);
