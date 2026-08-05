// Bespoke editor registry — resources listed here open a purpose-built form
// instead of the generic JSON editor. Everything else falls back to JSON.
import { TeacherForm } from "./TeacherForm";
import { BranchForm } from "./BranchForm";
import { CourseWizard } from "./CourseWizard";

export const BESPOKE_FORMS = {
  teachers: TeacherForm,
  branches: BranchForm,
  courses: CourseWizard,
};
