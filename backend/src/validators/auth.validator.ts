import { body } from 'express-validator';

const studentField = (label: string) =>
  body(label === 'hostelBlock' ? 'hostelBlock' : 'roomNumber').custom(
    (value, { req }) => {
      const role = req.body.role || 'student';
      if (role === 'student' && (!value || String(value).trim() === '')) {
        throw new Error(
          `${label === 'hostelBlock' ? 'Hostel block' : 'Room number'} is required for students`
        );
      }
      return true;
    }
  );

export const registerValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('A valid 10-digit phone number is required'),
  body('role')
    .optional()
    .isIn(['student', 'staff', 'owner', 'admin'])
    .withMessage('Invalid role'),
  studentField('hostelBlock'),
  studentField('roomNumber'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
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
