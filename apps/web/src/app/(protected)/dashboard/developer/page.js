"use client";

// ── Developer tools ──
// Admin-only maintenance. Mock data yükləmə düyməsi SİLİNDİ — o, bütün
// məzmunu silib demo data ilə əvəz edirdi və istehsalatda təsadüfən
// basılması bərpası mümkün olmayan itkiyə səbəb olurdu. Seed yalnız
// CLI-dan (scripts/seed.js) işlədilə bilər.

// Local
import I18nMigrationTool from "./_components/I18nMigrationTool";
import AutoTranslateTool from "./_components/AutoTranslateTool";
import CourseImportTool from "./_components/CourseImportTool";
import FlagImportTool from "./_components/FlagImportTool";
import TeacherImportTool from "./_components/TeacherImportTool";
import QuizImportTool from "./_components/QuizImportTool";
import PageContentImportTool from "./_components/PageContentImportTool";
import BlogImportTool from "./_components/BlogImportTool";
import SlugMigrationTool from "./_components/SlugMigrationTool";
import ContactImportTool from "./_components/ContactImportTool";
import MenuImportTool from "./_components/MenuImportTool";
import BranchImportTool from "./_components/BranchImportTool";
import SeedTool from "./_components/SeedTool";

export default function DeveloperPage() {
  return (
    <div>
      <p className="mb-6 text-sm text-gray-500">Yalnız admin üçün texniki alətlər.</p>

      <I18nMigrationTool />
      <AutoTranslateTool />
      <CourseImportTool />
      <FlagImportTool />
      <TeacherImportTool />
      <QuizImportTool />
      <PageContentImportTool />
      <BlogImportTool />
      <SlugMigrationTool />
      <ContactImportTool />
      <MenuImportTool />
      <BranchImportTool />

      {/* TAM SIFIRLAMA — ən altda, qırmızı çərçivə ilə */}
      <SeedTool />
    </div>
  );
}
