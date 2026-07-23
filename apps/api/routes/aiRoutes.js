import { Router } from "#constants";
import { aiController } from "#controllers";
import { authenticate } from "#middlewares";

const AIRouter = Router();

// AI content assistant (auth required). Returns 503 when AI is not configured.
AIRouter.post("/process", authenticate, aiController.process);

export { AIRouter };
