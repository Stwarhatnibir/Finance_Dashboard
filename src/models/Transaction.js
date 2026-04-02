const mongoose = require("mongoose");
const { TRANSACTION_TYPES } = require("../config/constants");

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: Object.values(TRANSACTION_TYPES),
        message: `Type must be one of: ${Object.values(TRANSACTION_TYPES).join(", ")}`,
      },
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
        return ret;
      },
    },
  }
);

// ─── Compound index for common dashboard aggregation queries ──────────────
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ category: 1, date: -1 });
transactionSchema.index({ isDeleted: 1, date: -1 });

// ─── Query middleware: exclude soft-deleted docs by default ───────────────
const excludeDeleted = function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
};

transactionSchema.pre("find", excludeDeleted);
transactionSchema.pre("findOne", excludeDeleted);
transactionSchema.pre("findOneAndUpdate", excludeDeleted);
transactionSchema.pre("countDocuments", excludeDeleted);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
