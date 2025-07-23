export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '15m', // Reduced from typical 1h for better security
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    expiresIn: '7d',
    // Enable token rotation
    rotation: true,
  },
  bcrypt: {
    saltRounds: 12, // Increased from typical 10 for better security
  },
  session: {
    // Maximum concurrent sessions per user
    maxSessions: 5,
    // Session timeout in minutes
    sessionTimeout: 60,
  },
  security: {
    // Enable additional security checks
    enableFingerprinting: true,
    // Token reuse detection
    detectTokenReuse: true,
    // IP validation
    validateIP: false, // Can be enabled for stricter security
  },
};