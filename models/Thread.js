import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chapter: {
    type: String,
    required: true,
    enum: ["fundamentals", "control-flow", "loops", "arrays", "functions"],
  },
  tags: [String],
  solved: {
    type: Boolean,
    default: false,
  },
  xp: {
    type: Number,
    default: 1, 
  },
  repliesCount: {
    type: Number,
    default: 0,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
}, {
  timestamps: true,
});

export default mongoose.model("Thread", threadSchema);
