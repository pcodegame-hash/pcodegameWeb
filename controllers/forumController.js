import Thread from "../models/Thread.js";
import Reply from "../models/Reply.js";
import User from "../models/User.js";

const getTierFromXp = (xp) => {
  if (xp >= 500) return "PROGAMER";
  if (xp >= 250) return "PROGRAMMER";
  if (xp >= 100) return "AMATEUR";
  return "NEWB";
};

const awardXpToUser = async (userId, amount) => {
  if (!userId || !amount) return null;

  const user = await User.findById(userId);
  if (!user) return null;

  user.xp = (user.xp || 0) + amount;
  user.tier = getTierFromXp(user.xp);
  await user.save();
  return user;
};

export const getThreads = async (req, res) => {
  try {
    const { chapter, search, sort = "recent", page = 1, limit = 20 } = req.query;
    let query = {};

    if (chapter && chapter !== "all") {
      query.chapter = chapter;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    let sortOption = {};
    if (sort === "recent") {
      sortOption = { createdAt: -1 };
    } else if (sort === "replies") {
      sortOption = { repliesCount: -1 };
    } else if (sort === "xp") {
      sortOption = { xp: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const threads = await Thread.find(query)
      .populate("author", "username tier")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Thread.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({ threads, total, page: pageNum, pages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createThread = async (req, res) => {
  try {
    const { title, content, chapter, tags } = req.body;
    const thread = await Thread.create({
      title,
      content,
      chapter,
      tags,
      author: req.user.id,
    });

    await awardXpToUser(req.user.id, 1);

    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id).populate("author", "username tier");
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const replies = await Reply.find({ thread: req.params.id }).populate("author", "username tier");
    res.json({ thread, replies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const reply = await Reply.create({
      content,
      thread: req.params.id,
      author: req.user.id,
    });

    await Thread.findByIdAndUpdate(req.params.id, { $inc: { repliesCount: 1 } });
    await awardXpToUser(req.user.id, 1);

    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const solveThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    if (thread.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to solve this thread" });
    }

    thread.solved = true;
    await thread.save();
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markReplyAsSolution = async (req, res) => {
  try {
    const { id, replyId } = req.params;

    const thread = await Thread.findById(id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    if (thread.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to mark this reply as solution" });
    }

    await Reply.updateMany({ thread: id }, { isSolution: false });

    const reply = await Reply.findByIdAndUpdate(
      replyId,
      { isSolution: true },
      { new: true }
    );

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    thread.solved = true;
    await thread.save();

    res.json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const upvoteThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const alreadyUpvoted = thread.upvotedBy.some((userId) => userId.toString() === req.user.id);
    if (alreadyUpvoted) {
      return res.status(400).json({ message: "Already upvoted" });
    }

    thread.upvotes += 1;
    thread.upvotedBy.push(req.user.id);
    await thread.save();

    if (thread.author.toString() !== req.user.id) {
      await awardXpToUser(thread.author, 2);
    }

    res.json({ thread, awardedXp: thread.author.toString() === req.user.id ? 0 : 2 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const upvoteReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const alreadyUpvoted = reply.upvotedBy.some((userId) => userId.toString() === req.user.id);
    if (alreadyUpvoted) {
      return res.status(400).json({ message: "Already upvoted" });
    }

    reply.upvotes += 1;
    reply.upvotedBy.push(req.user.id);
    await reply.save();

    if (reply.author.toString() !== req.user.id) {
      await awardXpToUser(reply.author, 2);
    }

    res.json({ reply, awardedXp: reply.author.toString() === req.user.id ? 0 : 2 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};