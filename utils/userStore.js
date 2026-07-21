import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(usersFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(usersFile, '[]', 'utf8');
    } else {
      throw error;
    }
  }
};

const readUsers = async () => {
  await ensureStore();
  const content = await fs.readFile(usersFile, 'utf8');
  return JSON.parse(content);
};

const writeUsers = async (users) => {
  await ensureStore();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
};

export const useFileStore = () => mongoose.connection.readyState !== 1;

export const findUserByEmailOrUsername = async ({ email, username }) => {
  const users = await readUsers();
  return users.find((user) => user.email === email || user.username === username) || null;
};

export const findUserByEmail = async (email) => {
  const users = await readUsers();
  return users.find((user) => user.email === email) || null;
};

export const findUserById = async (id) => {
  const users = await readUsers();
  return users.find((user) => user._id === id) || null;
};

export const createUserRecord = async ({ username, email, password }) => {
  const users = await readUsers();
  const user = {
    _id: randomUUID(),
    username,
    email,
    password,
    xp: 0,
    streak: 0,
    tier: 'NEWB',
    currentChapter: 'fundamentals',
    levelsCompleted: 0,
    chapterProgress: {
      fundamentals: { xp: 0, levels: 0 },
      loops: { xp: 0, levels: 0 },
      arrays: { xp: 0, levels: 0 },
      functions: { xp: 0, levels: 0 },
      controlFlow: { xp: 0, levels: 0 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  return user;
};

export const updateUserRecord = async (userId, updates) => {
  const users = await readUsers();
  const index = users.findIndex((user) => user._id === userId);
  if (index === -1) return null;

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeUsers(users);
  return users[index];
};

