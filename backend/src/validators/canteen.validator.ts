import { body } from 'express-validator';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createCanteenValidator = [
  body('name').trim().notEmpty().withMessage('Canteen name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('image').optional().isString().withMessage('Image must be a URL string'),
  body('openingHours.open')
    .matches(timeRegex)
    .withMessage('Opening time must be in HH:MM format'),
  body('openingHours.close')
    .matches(timeRegex)
    .withMessage('Closing time must be in HH:MM format'),
];

export const updateCanteenValidator = [
  body('name').optional().trim().notEmpty().withMessage('Canteen name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('image').optional().isString().withMessage('Image must be a URL string'),
  body('openingHours.open')
    .optional()
    .matches(timeRegex)
    .withMessage('Opening time must be in HH:MM format'),
  body('openingHours.close')
    .optional()
    .matches(timeRegex)
    .withMessage('Closing time must be in HH:MM format'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];
