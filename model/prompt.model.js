import mongoose from "mongoose";
const promptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.nownow,
  },
});

export const Prompt = mongoose.model("Prompt", promptSchema);
