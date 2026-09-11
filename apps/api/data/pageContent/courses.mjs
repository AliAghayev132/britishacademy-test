/**
 * Bütün kurs səhifələrinin başlanğıc məzmunu — `PageContentImportService`
 * bu siyahını istifadə edir. Kateqoriyalar ayrıca fayllardadır ki, redaktə
 * zamanı böyük bir faylda itməyəsiniz.
 */
import { COURSE_PAGES_LANGUAGES } from "./coursesLanguages.mjs";
import { COURSE_PAGES_EXAMS } from "./coursesExams.mjs";
import { COURSE_PAGES_CAREER_KIDS } from "./coursesCareerKids.mjs";

export const COURSE_PAGES = [...COURSE_PAGES_LANGUAGES, ...COURSE_PAGES_EXAMS, ...COURSE_PAGES_CAREER_KIDS];
