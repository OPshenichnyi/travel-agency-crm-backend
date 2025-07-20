import { validationResult, body } from "express-validator";

/**
 * Middleware to validate request data using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        status: 422,
        message: "Validation failed",
        details: errors.array().map((err) => err.msg),
      },
    });
  }
  next();
};

/**
 * Validation rules for bank account
 */
const validateBankAccount = [
  body("bankName")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Bank name must be between 3 and 100 characters")
    .notEmpty()
    .withMessage("Bank name is required"),

  body("swift")
    .trim()
    .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .withMessage(
      "Invalid SWIFT/BIC format. Must be 8 or 11 characters, uppercase letters and numbers only"
    )
    .notEmpty()
    .withMessage("SWIFT/BIC is required"),

  body("iban")
    .trim()
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/)
    .withMessage("Invalid IBAN format")
    .notEmpty()
    .withMessage("IBAN is required"),

  body("holderName")
    .trim()
    .matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/)
    .withMessage("Holder name can only contain letters and spaces")
    .isLength({ min: 2, max: 100 })
    .withMessage("Holder name must be between 2 and 100 characters")
    .notEmpty()
    .withMessage("Holder name is required"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address cannot exceed 200 characters")
    .matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ0-9\s\.,\-\(\)]+$/)
    .withMessage("Address contains invalid characters"),

  body("identifier")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Identifier must be between 1 and 50 characters")
    .notEmpty()
    .withMessage("Identifier is required"),

  validate,
];

export { validate, validateBankAccount };
