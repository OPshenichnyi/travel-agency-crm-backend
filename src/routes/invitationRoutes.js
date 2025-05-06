import express from "express";
import { body, query, param } from "express-validator";
import {
  createInvitationController,
  getInvitationsController,
  cancelInvitationController,
} from "../controllers/invitationController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

// Всі маршрути потребують автентифікації
router.use(authenticate);

/**
 * @swagger
 * /invitations:
 *   post:
 *     summary: Створення запрошення для нового користувача
 *     description: Дозволяє адміністратору створити запрошення для менеджера, або менеджеру створити запрошення для агента
 *     tags: [Запрошення]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email для запрошення
 *               role:
 *                 type: string
 *                 enum: [manager, agent]
 *                 description: Роль для запрошеного користувача
 *     responses:
 *       201:
 *         description: Запрошення успішно створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation created successfully
 *                 invitation:
 *                   $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Неправильні дані запиту
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       409:
 *         description: Користувач з цим email вже існує або активне запрошення вже існує
 *       422:
 *         description: Помилка валідації даних
 */
router.post(
  "/",
  [
    // Валідація даних
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("role")
      .isIn(["manager", "agent"])
      .withMessage("Role must be either manager or agent"),

    // Перевірка прав доступу:
    // Тільки адміністратор може запрошувати менеджерів
    // Адміністратори та менеджери можуть запрошувати агентів
    (req, res, next) => {
      const { role } = req.body;
      const userRole = req.user.role;

      if (role === "manager" && userRole !== "admin") {
        return res.status(403).json({
          error: {
            status: 403,
            message: "Only admin can invite managers",
          },
        });
      }

      if (role === "agent" && !["admin", "manager"].includes(userRole)) {
        return res.status(403).json({
          error: {
            status: 403,
            message: "Only admin or manager can invite agents",
          },
        });
      }

      next();
    },

    validate,
  ],
  createInvitationController
);

/**
 * @swagger
 * /invitations:
 *   get:
 *     summary: Отримання списку запрошень
 *     description: Отримує список запрошень. Адміністратор бачить всі запрошення, а менеджери - тільки створені ними.
 *     tags: [Запрошення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер сторінки
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Кількість елементів на сторінці
 *       - in: query
 *         name: invitedBy
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID користувача, який створив запрошення (тільки для адміністратора)
 *     responses:
 *       200:
 *         description: Список запрошень
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Унікальний ідентифікатор запрошення
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Email, на який надіслано запрошення
 *                       role:
 *                         type: string
 *                         enum: [manager, agent]
 *                         description: Роль для запрошеного користувача
 *                       token:
 *                         type: string
 *                         description: Унікальний токен для реєстрації
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         description: Дата закінчення дії запрошення
 *                       used:
 *                         type: boolean
 *                         description: Чи було використано запрошення
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Дата створення запрошення
 *                       inviter:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           email:
 *                             type: string
 *                             format: email
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                 total:
 *                   type: integer
 *                   description: Загальна кількість запрошень
 *                 page:
 *                   type: integer
 *                   description: Поточна сторінка
 *                 totalPages:
 *                   type: integer
 *                   description: Загальна кількість сторінок
 *                 limit:
 *                   type: integer
 *                   description: Кількість елементів на сторінці
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 */
router.get(
  "/",
  [
    // Валідація параметрів запиту
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("invitedBy")
      .optional()
      .isUUID(4)
      .withMessage("Invalid invitedBy ID format"),
    validate,
  ],
  getInvitationsController
);

/**
 * @swagger
 * /invitations/{id}:
 *   delete:
 *     summary: Скасування запрошення
 *     description: Скасовує запрошення. Адміністратор може скасувати будь-яке запрошення, менеджери - тільки створені ними.
 *     tags: [Запрошення]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID запрошення
 *     responses:
 *       200:
 *         description: Запрошення успішно скасовано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation cancelled successfully
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: ID скасованого запрошення
 *       401:
 *         description: Необхідна автентифікація
 *       403:
 *         description: Недостатньо прав для виконання операції
 *       404:
 *         description: Запрошення не знайдено
 */
router.delete(
  "/:id",
  [
    // Валідація параметрів
    param("id").isUUID(4).withMessage("Invalid invitation ID format"),
    validate,
  ],
  cancelInvitationController
);

export default router;
