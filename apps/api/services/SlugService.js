/**
 * SlugService — Azerbaijani-aware slug generation.
 *
 * The template's EncryptionService.generateSlug() keeps only [a-z0-9], which
 * destroys Azerbaijani text ("Uşaqlar üçün" -> "uaqlar-n"). Every slug on this
 * site comes from Azerbaijani titles, so we transliterate first.
 */

// Order matters: uppercase forms are mapped before lowercasing so that
// "İ" (U+0130) does not decompose into "i" + combining dot.
const TRANSLIT = {
  Ə: "e", ə: "e",
  I: "i", İ: "i", ı: "i",
  Ö: "o", ö: "o",
  Ü: "u", ü: "u",
  Ş: "s", ş: "s",
  Ç: "c", ç: "c",
  Ğ: "g", ğ: "g",
  // Turkish / common extras
  Â: "a", â: "a", Î: "i", î: "i", Û: "u", û: "u",
  // Russian (blog tags, course names may carry them)
  А: "a", а: "a", Б: "b", б: "b", В: "v", в: "v", Г: "g", г: "g",
  Д: "d", д: "d", Е: "e", е: "e", Ё: "e", ё: "e", Ж: "j", ж: "j",
  З: "z", з: "z", И: "i", и: "i", Й: "y", й: "y", К: "k", к: "k",
  Л: "l", л: "l", М: "m", м: "m", Н: "n", н: "n", О: "o", о: "o",
  П: "p", п: "p", Р: "r", р: "r", С: "s", с: "s", Т: "t", т: "t",
  У: "u", у: "u", Ф: "f", ф: "f", Х: "h", х: "h", Ц: "ts", ц: "ts",
  Ч: "ch", ч: "ch", Ш: "sh", ш: "sh", Щ: "sch", щ: "sch",
  Ы: "i", ы: "i", Э: "e", э: "e", Ю: "yu", ю: "yu", Я: "ya", я: "ya",
  Ъ: "", ъ: "", Ь: "", ь: "",
};

class SlugService {
  /** Transliterate Azerbaijani/Cyrillic characters to ASCII. */
  static transliterate(text) {
    return String(text || "")
      .split("")
      .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
      .join("");
  }

  /** "Uşaqlar üçün İngilis dili" -> "usaqlar-ucun-ingilis-dili" */
  static slugify(text) {
    return this.transliterate(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // strip leftover diacritics
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96);
  }

  /**
   * Slugify and guarantee uniqueness within a collection.
   * Appends -2, -3, ... when the base slug is already taken.
   *
   * @param {import('mongoose').Model} model  collection to check against
   * @param {string} text                     source text
   * @param {string|null} excludeId           document being updated (ignored in the check)
   */
  static async unique(model, text, excludeId = null) {
    const base = this.slugify(text) || "element";
    let slug = base;
    let n = 1;
    // Bounded loop: practically resolves on the first or second try.
    while (n < 100) {
      const query = { slug };
      if (excludeId) query._id = { $ne: excludeId };
      const clash = await model.exists(query);
      if (!clash) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
    return `${base}-${Date.now()}`;
  }
}

export { SlugService };
