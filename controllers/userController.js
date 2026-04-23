import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID");

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ where: { email } });
  const phoneExists = await User.findOne({ where: { phone } });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }
  if (phoneExists) {
    return res.status(400).json({ message: "Phone number already exists" });
  }

  const user = await User.create({ name, email, password, phone });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: generateToken(user.id),
  });
};

// LOGIN
export const loginUser = async (req, res) => {
  const { phone, email, password } = req.body;

  // Find user by either email or phone depending on what is provided
  let user;
  if (email) {
    user = await User.findOne({ where: { email } });
  } else if (phone) {
    user = await User.findOne({ where: { phone } });
  }

  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

// GOOGLE AUTH
export const googleAuth = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create a user without a traditional password
      user = await User.create({
        name,
        email,
        password: Date.now().toString(), // Dummy password since Google handles auth
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    // Try to get info from the google userinfo endpoint if it's an access token
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch user with access token");

      const payload = await response.json();
      const { email, name } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          name,
          email,
          password: Date.now().toString(),
        });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } catch (err) {
      console.error("Google Auth Error:", err);
      res.status(401).json({ message: "Invalid Google Token" });
    }
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      addresses: user.addresses,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // Only update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      
      if (req.body.addresses) {
        if (req.body.addresses.length > 3) {
           return res.status(400).json({ message: "Cannot store more than 3 addresses" });
        }
        user.addresses = req.body.addresses;
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
        role: updatedUser.role,
        token: generateToken(updatedUser.id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: error.message || "Failed to update profile", error: error.toString() });
  }
};