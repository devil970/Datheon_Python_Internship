import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { handleContact } from '../controllers/contactController.js';

const router = Router();

// ── Strict rate limit: 5 submissions per 10 minutes per IP (anti-spam)
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please wait 10 minutes.' },
});

// ── Validation rules
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('subject')
    .trim()
    .isIn(['internship', 'job', 'freelance', 'collaboration', 'other'])
    .withMessage('Invalid subject selected.'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters.')
    .escape(),
];

// ── Validation result middleware
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array().map(e => e.msg) });
  }
  next();
};

router.post('/', contactLimiter, validateContact, checkValidation, handleContact);

export default router;
