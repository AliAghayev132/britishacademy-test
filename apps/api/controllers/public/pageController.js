// Models
import { Testimonial, Page, Partner, Faq } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

/* ---------------- Testimonials ---------------- */

const listTestimonials = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  const testimonials = await Testimonial.findPublic(filter);
  ok(res, { testimonials });
});

/* ---------------- Editorial pages ---------------- */

const getPageBySlug = asyncHandler(async (req, res) => {
  const pageDoc = await Page.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!pageDoc) {
    return fail(res, "Səhifə tapılmadı", 404);
  }
  ok(res, { page: pageDoc });
});

const listPartners = asyncHandler(async (_req, res) => {
  const partners = await Partner.findPublic();
  ok(res, { partners });
});

const listFaqs = asyncHandler(async (_req, res) => {
  const faqs = await Faq.findPublic();
  ok(res, { faqs });
});

export { listTestimonials, getPageBySlug, listPartners, listFaqs };
