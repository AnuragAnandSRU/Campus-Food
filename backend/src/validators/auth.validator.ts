import { body } from 'express-validator';

// Public registration is students-only, so hostel block and room number are
// always required here (the controller forces role='student').
export const registerValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('A valid 10-digit phone number is required'),
  body('hostelBlock').trim().notEmpty().withMessage('Hostel block is required'),
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  // Optional: which "door" the login came through. The controller uses it to
  // refuse accounts whose role doesn't belong to that entrance.
  body('audience')
    .optional()
    .isIn(['student', 'business', 'admin'])
    .withMessage('Invalid login audience'),
];

export const acceptInviteValidator = [
  body('token').notEmpty().withMessage('Invitation token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('A valid 10-digit phone number is required'),
  body('hostelBlock')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Hostel block must be under 50 characters'),
  body('roomNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Room number must be under 20 characters'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];
