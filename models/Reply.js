import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    required: true,
  },
  isSolution: {
    type: Boolean,
    default: false,
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

export default mongoose.model("Reply", replySchema);