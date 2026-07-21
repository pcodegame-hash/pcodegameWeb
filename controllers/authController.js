import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  useFileStore,
  findUserByEmailOrUsername,
  findUserByEmail,
  findUserById,
  createUserRecord,
} from "../utils/userStore.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const getUserLookup = async ({ email, username }) => {
  if (useFileStore()) {
    return findUserByEmailOrUsername({ email, username });
  }

  const existing = await User.findOne({
    $or: [{ email }, { username }],
  });

  return existing;
};

const getUserByEmail = async (email) => {
  if (useFileStore()) {
    return findUserByEmail(email);
  }

  return User.findOne({ email });
};

const getUserById = async (id) => {
  if (useFileStore()) {
    return findUserById(id);
  }

  return User.findById(id).select("-password");
};

const createUser = async (userData) => {
  if (useFileStore()) {
    return createUserRecord(userData);
  }

  return User.create(userData);
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existing = await getUserLookup({ email, username });

    if (existing) {
      if (existing.email === email) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (existing.username === username) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      id: user._id,
    });

  } catch (err) {
    if (err && err.code === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : null;
      const val = err.keyValue ? err.keyValue[key] : null;
      return res.status(400).json({ message: key ? `${key} already exists: ${val}` : 'Duplicate value' });
    }

    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const safeUser = user.toObject ? user.toObject() : user;
    delete safeUser.password;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};