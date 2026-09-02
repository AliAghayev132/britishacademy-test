import { notFound } from "next/navigation";

import { apiGetStatus, isMissing } from "@/lib/api";
import { getLocale, getT } from "@/lib/i18n/serverT";
import { buildMetadata, metaFromApi } from "@/lib/seo";
import { QuizRunner } from "@/components/site/QuizRunner";

/**
 * Bir testin səhifəsi.
 *
 * SUALLAR SERVERDƏ ALINIR, cavablar isə client-dən API-yə göndərilir və
 * orada yoxlanılır — düzgün cavab bu səhifəyə heç vaxt düşmür.
 *
 * `revalidate: 0` — test təsadüfi sıralana bilər (questionOrder: "random"),
 * keşlənmiş səhifə hamıya eyni sıranı verərdi.
 */

export const revalidate = 0;

async function fetchQuiz(slug) {
  return apiGetStatus(`/quizzes/${slug}`, { revalidate: 0 });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await fetchQuiz(slug);
  const quiz = res?.data;
  if (!quiz) return buildMetadata({ path: `/testler/${slug}` });

  return buildMetadata({
    ...metaFromApi(quiz.seo, { title: quiz.title, description: quiz.lead }),
    path: `/testler/${slug}`,
  });
}

export default async function QuizPage({ params }) {
  const { slug } = await params;
  const [res, t, locale] = await Promise.all([fetchQuiz(slug), getT(), getLocale()]);

  // isMissing: şəbəkə sıçrayışını 404 kimi göstərmir — əks halda müvəqqəti
  // API kəsilməsi səhifəni axtarış indeksindən çıxarardı.
  if (isMissing(res, "slug")) notFound();

  const quiz = res.data;

  return (
    // `container` sinfi globals.css-də YOXDUR — səhifə mərkəzləşmirdi və sol
    // kənara yapışırdı. Digər public səhifələrdəki sarğı naxışı işlədilir.
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 28px 72px" }}>
      <header style={{ marginBottom: 26 }}>
        <h1
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: 32,
            fontWeight: 800,
            color: "#14141C",
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {quiz.title}
        </h1>
        {quiz.lead && (
          <p style={{ margin: "9px 0 0", fontSize: 15.5, color: "#63636F", lineHeight: 1.65 }}>
            {quiz.lead}
          </p>
        )}
        {quiz.description && (
          <p
            style={{
              margin: "14px 0 0",
              padding: "13px 16px",
              background: "#F7F8FB",
              borderRadius: 14,
              fontSize: 14.5,
              color: "#5A5A66",
              lineHeight: 1.65,
            }}
          >
            {quiz.description}
          </p>
        )}
      </header>

      {/* `lang` submit sorğusuna ötürülür — hansı dildə həll edildiyi
          statistikada saxlanılsın. */}
      <QuizRunner quiz={{ ...quiz, lang: locale }} />

      <p style={{ marginTop: 28, fontSize: 13, color: "#A6A6B0", textAlign: "center" }}>
        {t("quiz.listSub")}
      </p>
    </main>
  );
}
