// Constants
import { Router } from "#constants";

// Controllers
import { aiController } from "#controllers";

// Middlewares
import { authenticate } from "#middlewares";

const AIRouter = Router();

// AI content assistant (auth required). Returns 503 when AI is not configured.
AIRouter.get("/status", authenticate, aiController.status);
AIRouter.post("/process", authenticate, aiController.process);

export { AIRouter };
