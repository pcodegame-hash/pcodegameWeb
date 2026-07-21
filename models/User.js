import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    default: 0,
  },
  streak: {
    type: Number,
    default: 0,
  },
  tier: {
    type: String,
    enum: ["NEWB", "AMATEUR", "PROGRAMMER", "PROGAMER"],
    default: "NEWB",
  },
  currentChapter: {
    type: String,
    default: "fundamentals",
  },
  levelsCompleted: {
    type: Number,
    default: 0,
  },
  chapterProgress: {
    fundamentals: { xp: { type: Number, default: 0 }, levels: { type: Number, default: 0 } },
    loops: { xp: { type: Number, default: 0 }, levels: { type: Number, default: 0 } },
    arrays: { xp: { type: Number, default: 0 }, levels: { type: Number, default: 0 } },
    functions: { xp: { type: Number, default: 0 }, levels: { type: Number, default: 0 } },
    controlFlow: { xp: { type: Number, default: 0 }, levels: { type: Number, default: 0 } },
  },
}, {
  timestamps: true,
});

export default mongoose.model("User", userSchema);
