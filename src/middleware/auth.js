import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token is invalid or expired'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Admin authorization
export const authorize = (...roles) => {
  return async (req, res, next) => {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.userId);

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this route'
      });
    }

    next();
  };
};
