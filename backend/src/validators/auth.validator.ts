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
