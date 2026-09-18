// Models
import {
  SiteSetting,
  Branch,
  Teacher,
  CourseCategory,
  Course,
  Testimonial,
  Destination,
  MenuItem,
  Partner,
  Advantage,
  Page,
  Faq,
  Quiz,
} from "#models";

// ── Wipe + insert ──
export async function insertGraph(graph) {
  await SiteSetting.deleteMany({});
  await Promise.all([
    Branch.deleteMany({}), Teacher.deleteMany({}), CourseCategory.deleteMany({}),
    Course.deleteMany({}), Testimonial.deleteMany({}),
    Destination.deleteMany({}), MenuItem.deleteMany({}), Partner.deleteMany({}),
    Advantage.deleteMany({}), Page.deleteMany({}), Faq.deleteMany({}), Quiz.deleteMany({}),
  ]);
  await graph.site.save();
  await Branch.insertMany(graph.branches);
  await CourseCategory.insertMany(graph.categories);
  await Teacher.insertMany(graph.teachers);
  await Course.insertMany(graph.courses);
  await Destination.insertMany(graph.destinations);
  await Testimonial.insertMany(graph.testimonials);
  await Advantage.insertMany(graph.advantages);
  await Partner.insertMany(graph.partners);
  await MenuItem.insertMany(graph.menu);
  await Page.insertMany(graph.pages);
  await Faq.insertMany(graph.faqs);
  await Quiz.insertMany(graph.quizzes);

  return {
    Branch: graph.branches.length, Category: graph.categories.length, Teacher: graph.teachers.length,
    Course: graph.courses.length, Destination: graph.destinations.length,
    Testimonial: graph.testimonials.length, Advantage: graph.advantages.length, Partner: graph.partners.length,
    Menu: graph.menu.length, Page: graph.pages.length, Faq: graph.faqs.length, Quiz: graph.quizzes.length,
  };
}
