const jwt = require('jsonwebtoken');

/**
 * Signs a JWT token for a given user ID
 * @param {string} id - User MongoDB _id
 * @returns {string} - Signed JWT
 */
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Creates and sends a JWT token in the response body
 * @param {Object} user - User document (password excluded)
 * @param {number} statusCode
 * @param {Object} res - Express response
 */
const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Strip sensitive fields
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;

    return res.status(statusCode).json({
        success: true,
        token,
        data: { user: userObj },
    });
};

module.exports = { signToken, sendTokenResponse };
