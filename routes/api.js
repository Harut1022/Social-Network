import { Router } from 'express';
import userController from '../controllers/user.js'
import { authMiddleware } from '../lib/middleware.js';
const router = Router();


/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Creates a new user
 *     description: This endpoint allows you to create a new user.
 *     tags:
 *       - Resource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: <code>{status:string,message?:string}</code>
 *       
 */
router.post('/signup', userController.signupHandler)
/**
 * @swagger
 * /login:
 *   post:
 *     summary: User signin 
 *     description: This endpoint allows you to signin a new user.
 *     tags:
 *       - Resource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: <code>{status:string,message?:string}</code>
 *       
 */
router.post('/login', userController.loginHandler)
/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Retrieves a current authenticated user
 *     description: If there's no authenticated user error message is sent
 *     tags:
 *       - Resource
 *     responses:
 *       200:
 *         description: <code>{status:string, message?:string, user:IUser|null}</code>
 */
router.get('/verify',authMiddleware, userController.authHandler)

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Sign outs a user
 *     description: This endpoint allows you to signout a current user.
 *     tags:
 *       - Resource
 *     responses:
 *       200:
 *         description: <code>{status:string,message?:string, user:IUser|null}</code>
 *       
 */
router.post('/logout', authMiddleware, userController.logoutHandler)




export default router;
