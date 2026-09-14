/**
 * Siyahı sorğularının `?page=&limit=` hesabı.
 *
 * Eyni 3 sətir 5 controllerdə təkrarlanırdı və fərqlənməyə başlamışdı
 * (biri `skip`-i ayrıca hesablayır, biri sətirdaxili; mənfi/sıfır limit
 * yoxlaması hər yerdə eyni deyildi).
 *
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePage(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

/** Cavabdakı `pagination` bloku. */
export function pageInfo({ page, limit }, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}
