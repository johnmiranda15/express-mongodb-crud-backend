import { Schema, model } from "mongoose";

const TaskSchema = Schema(
  {
    title: { type: String, required: true, trim: true },
    description: {
      type: String,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("Task", TaskSchema);
