// Models
import { BlogPost, BlogCategory } from "#models";

// Utils
import { fail, ok, pageInfo, parsePage, asyncHandler } from "#utils";

/* ---------------- Blog ---------------- */

const listBlog = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query, { defaultLimit: 9, maxLimit: 50 });

  const filter = { status: "published", isDeleted: false };
  if (req.query.category) {
    const cat = await BlogCategory.findOne({ slug: req.query.category, isDeleted: false });
    // Naməlum kateqoriya əvvəl bütün yazıları göstərirdi (audit #40).
    filter.category = cat ? cat._id : { $in: [] };
  }

  const [posts, total, categories] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug color")
      .populate("author", "firstName lastName"),
    BlogPost.countDocuments(filter),
    BlogCategory.findPublic(),
  ]);

  ok(res, {
    posts,
    categories,
    pagination: pageInfo({ page, limit }, total),
  });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({
    slug: req.params.slug,
    status: "published",
    isDeleted: false,
  })
    .populate("category", "name slug color")
    .populate("author", "firstName lastName avatar");
  if (!post) {
    return fail(res, "Yazı tapılmadı", 404);
  }
  ok(res, { post });
});

export { listBlog, getBlogBySlug };
