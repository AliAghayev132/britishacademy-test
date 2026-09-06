// Constants
import { Router, adminRoles } from "#constants";

// Controllers
import { aiController } from "#controllers";

// Middlewares
import { authenticate, requireRole } from "#middlewares";

const AIRouter = Router();

// AI sorğuları ödənişlidir (OpenRouter). Əvvəl yalnız `authenticate` vardı,
// yəni panel rolu olmayan hesab da büdcəni yandıra bilərdi.
AIRouter.use(authenticate, requireRole(adminRoles));

// AI content assistant (auth required). Returns 503 when AI is not configured.
AIRouter.get("/status", aiController.status);
AIRouter.post("/process", aiController.process);

export { AIRouter };
