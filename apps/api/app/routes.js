// Middlewares
import { revalidateOnWrite } from "#middlewares";

// Routes
import { AuthRouter, MediaRouter, AIRouter, PublicRouter, AdminRouter } from "#routes";

/**
 * Configure API routes
 */
export const setupRoutes = (app) => {
  app.use("/api/auth", AuthRouter);
  app.use("/api/media", MediaRouter);
  app.use("/api/ai", AIRouter);

  // ---- British Academy ----
  // ADMIN FIRST: every /api/admin/* route is authenticated + role-gated.
  // Mounting it before the public router guarantees no future public path can
  // ever shadow an admin one (PublicRouter is mounted on the bare /api prefix).
  // Uğurlu admin yazmasından sonra saytın keşi dərhal təmizlənir (audit #37).
  app.use("/api/admin", revalidateOnWrite);
  app.use("/api/admin", AdminRouter);

  // PUBLIC: read-only, no auth. The single write endpoint is POST /api/leads
  // (rate-limited) — see routes/publicRoutes.js.
  app.use("/api", PublicRouter);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });
};
