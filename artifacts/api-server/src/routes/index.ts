import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import friendsRouter from "./friends";
import notificationsRouter from "./notifications";
import feedRouter from "./feed";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(friendsRouter);
router.use(notificationsRouter);
router.use(feedRouter);
router.use(conversationsRouter);

export default router;
