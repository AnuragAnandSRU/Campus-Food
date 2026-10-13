import { body } from 'express-validator';

/** Admin provisioning of a staff or owner account (invite-link flow). */
export const provisionUserValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('A valid 10-digit phone number is required'),
  body('role').isIn(['staff', 'owner']).withMessage('Role must be staff or owner'),
  body('canteenId').isMongoId().withMessage('A valid canteen must be selected'),
  // Staff must be assigned at least one duty (kitchen/delivery/both); owners
  // don't need duties. Each entry must be a known duty.
  body('staffDuties')
    .if(body('role').equals('staff'))
    .isArray({ min: 1 })
    .withMessage('Assign at least one duty: kitchen, delivery, or both'),
  body('staffDuties.*')
    .optional()
    .isIn(['kitchen', 'delivery'])
    .withMessage('Duty must be kitchen or delivery'),
  // Optional powers granted to a staff member up front.
  body('permissions').optional().isArray().withMessage('Permissions must be a list'),
  body('permissions.*')
    .optional()
    .isIn(['manage_menu', 'view_analytics'])
    .withMessage('Unknown permission'),
];
