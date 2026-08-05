// Constants
import { Router } from "#constants";

// Controllers
import { postController } from "#controllers";

// Middlewares
import { authenticate, writeRateLimiter } from "#middlewares";

const PostRouter = Router();

// Public
PostRouter.get("/", postController.listPosts);
// Slug lookup must be registered before "/:id" so it is not captured by it.
PostRouter.get("/slug/:slug", postController.getPostBySlug);
PostRouter.get("/:id", postController.getPost);

// Protected (write operations)
PostRouter.post("/", authenticate, writeRateLimiter, postController.createPost);
PostRouter.put("/:id", authenticate, writeRateLimiter, postController.updatePost);
PostRouter.delete(
  "/:id",
  authenticate,
  writeRateLimiter,
  postController.deletePost,
);

export { PostRouter };
