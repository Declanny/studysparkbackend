import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

// Generate Access Token (short-lived: 15 minutes)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (long-lived: 30 days)
const generateRefreshToken = async (userId, ipAddress) => {
  // Create random token
  const token = crypto.randomBytes(40).toString('hex');

  // Save to database
  const refreshToken = await RefreshToken.create({
    token,
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdByIp: ipAddress
  });

  return refreshToken.token;
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, password, name, school, course, level } = req.body;

    // Validation
    if (!email || !password || !name || !course || !level) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      school,
      course,
      level
    });

    // Generate tokens
    const ipAddress = req.ip || req.connection.remoteAddress;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, ipAddress);

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const ipAddress = req.ip || req.connection.remoteAddress;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, ipAddress);

    res.json({
      success: true,
      user: user.toJSON(),
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    // Revoke the refresh token
    const token = await RefreshToken.findOne({ token: refreshToken });
    if (token) {
      token.revokedAt = Date.now();
      token.revokedByIp = req.ip || req.connection.remoteAddress;
      await token.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Find refresh token in database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || !storedToken.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Get user
    const user = await User.findById(storedToken.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new tokens
    const ipAddress = req.ip || req.connection.remoteAddress;
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = await generateRefreshToken(user._id, ipAddress);

    // Revoke old refresh token and mark it as replaced
    storedToken.revokedAt = Date.now();
    storedToken.revokedByIp = ipAddress;
    storedToken.replacedByToken = newRefreshToken;
    await storedToken.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during token refresh'
    });
  }
};
