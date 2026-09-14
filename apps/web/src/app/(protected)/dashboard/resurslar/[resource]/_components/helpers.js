/** Bir səhifədəki element sayı — sıralamanın sürüşməsi də bundan hesablanır. */
export const PAGE_SIZE = 20;

/** Ana səhifə bölmələrinin göstərdiyi maksimum say (publicController.getHome). */
export const HOME_LIMITS = { courses: 6, destinations: 8, testimonials: 6, teachers: 8 };

/** JSON redaktoru üçün sənəd — serverin idarə etdiyi sahələr çıxarılır. */
export function editableDoc(item) {
  const doc = item ? { ...item } : {};
  // Strip server-managed fields from the editable JSON.
  delete doc._id; delete doc.createdAt; delete doc.updatedAt; delete doc.id;
  delete doc.__v; delete doc.isDeleted;
  return doc;
}
