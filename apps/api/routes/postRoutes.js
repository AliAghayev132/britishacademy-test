// Constants
import { Router, adminRoles } from "#constants";

// Controllers
import { postController } from "#controllers";

// Middlewares
import { authenticate, requireRole, writeRateLimiter } from "#middlewares";

const PostRouter = Router();

// Public
PostRouter.get("/", postController.listPosts);
// Slug lookup must be registered before "/:id" so it is not captured by it.
PostRouter.get("/slug/:slug", postController.getPostBySlug);
PostRouter.get("/:id", postController.getPost);

// Protected (write operations)
PostRouter.post("/", authenticate,
  requireRole(adminRoles),
  writeRateLimiter, postController.createPost);
PostRouter.put("/:id", authenticate,
  requireRole(adminRoles),
  writeRateLimiter, postController.updatePost);
PostRouter.delete(
  "/:id",
  authenticate,
  requireRole(adminRoles),
  writeRateLimiter,
  postController.deletePost,
);

export { PostRouter };
