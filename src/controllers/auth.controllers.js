import jwt from "jsonwebtoken";
import User from "../model/User.js";
import { JWT_SECRET } from "../config.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

// POST /auth/register -> crear cuenta
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Username or email already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

// POST /auth/login -> iniciar sesión
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
