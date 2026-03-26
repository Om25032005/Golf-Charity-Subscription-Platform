const { body } = require('express-validator');

const signupValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    body('charity')
        .notEmpty().withMessage('Please select a charity')
        .isMongoId().withMessage('Invalid charity ID'),
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

const scoreValidation = [
    body('score')
        .isInt({ min: 1, max: 45 })
        .withMessage('Score must be an integer between 1 and 45'),
];

const charityValidation = [
    body('name').trim().notEmpty().withMessage('Charity name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
];

module.exports = {
    signupValidation,
    loginValidation,
    scoreValidation,
    charityValidation,
};
