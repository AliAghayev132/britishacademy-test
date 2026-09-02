// Bespoke editor registry — resources listed here open a purpose-built form
// instead of the generic JSON editor. Everything else falls back to JSON.

// Local
import { TeacherForm } from "./TeacherForm";
import { BranchForm } from "./BranchForm";
import { CourseWizard } from "./CourseWizard";
import { CourseCategoryForm } from "./CourseCategoryForm";
import { CourseGroupForm } from "./CourseGroupForm";
import { DestinationForm } from "./DestinationForm";
import { ProjectForm } from "./ProjectForm";
import { TestimonialForm } from "./TestimonialForm";
import { BlogPostForm } from "./BlogPostForm";
import { BlogCategoryForm } from "./BlogCategoryForm";
import { QuizCategoryForm } from "./QuizCategoryForm";
import { MenuItemForm } from "./MenuItemForm";
import { PageForm } from "./PageForm";
import { PartnerForm } from "./PartnerForm";
import { AdvantageForm } from "./AdvantageForm";
import { FaqForm } from "./FaqForm";
import { MediaForm } from "./MediaForm";

export const BESPOKE_FORMS = {
  teachers: TeacherForm,
  branches: BranchForm,
  courses: CourseWizard,
  "course-categories": CourseCategoryForm,
  "course-groups": CourseGroupForm,
  destinations: DestinationForm,
  projects: ProjectForm,
  testimonials: TestimonialForm,
  "blog-posts": BlogPostForm,
  "blog-categories": BlogCategoryForm,
  "quiz-categories": QuizCategoryForm,
  "menu-items": MenuItemForm,
  pages: PageForm,
  partners: PartnerForm,
  advantages: AdvantageForm,
  faqs: FaqForm,
  media: MediaForm,
};
