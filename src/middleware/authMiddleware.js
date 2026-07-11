import supabase from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token missing or invalid format',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        code: 'AUTH_INVALID',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server authorization error',
      code: 'INTERNAL_AUTH_ERROR',
    });
  }
};

export const requireSelf = (req, res, next) => {
  const targetId = req.params.id || req.params.userId;

  if (!req.user || req.user.id !== targetId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to modify this resource',
      code: 'FORBIDDEN',
    });
  }

  return next();
};