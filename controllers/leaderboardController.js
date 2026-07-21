import User from "../models/User.js";

const TIER_RANK = {
  NEWB: 1,
  AMATEUR: 2,
  PROGRAMMER: 3,
  PROGAMER: 4,
};

const CHAPTER_FIELD_MAP = {
  fundamentals: "fundamentals",
  "control-flow": "controlFlow",
  loops: "loops",
  arrays: "arrays",
  functions: "functions",
};

export const getLeaderboard = async (req, res) => {
  try {
    const { sort = "xp", chapter = "all" } = req.query;

    const chapterField = CHAPTER_FIELD_MAP[chapter];
    const isChapterScoped = chapter !== "all" && Boolean(chapterField);

    const xpPath = isChapterScoped
      ? `chapterProgress.${chapterField}.xp`
      : "xp";

    const sortMap = {
      xp: { [xpPath]: -1 },
      streak: { streak: -1 },
      tier: { [xpPath]: -1 },
    };

    const users = await User.find()
      .select("username xp streak tier levelsCompleted chapterProgress")
      .sort(sortMap[sort] ?? sortMap.xp)
      .lean();

    let leaderboard = users.map((user) => {
      const chapterStats = isChapterScoped
        ? user.chapterProgress?.[chapterField]
        : null;

      return {
        username: user.username,
        xp: chapterStats ? chapterStats.xp ?? 0 : user.xp,
        streak: user.streak,
        tier: user.tier,
        levels: chapterStats ? chapterStats.levels ?? 0 : user.levelsCompleted,
      };
    });

    if (sort === "tier") {
      leaderboard.sort((a, b) => {
        const rankDiff = (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0);
        return rankDiff !== 0 ? rankDiff : b.xp - a.xp;
      });
    }

    leaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};