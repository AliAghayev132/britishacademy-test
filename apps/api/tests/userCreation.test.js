import { describe, it, expect } from "vitest";
import { User } from "#models";

// REGRESSİYA QORUMASI.
// bootstrapDeveloper və adminDoctor hesabı `lastName: ""` ilə yaradırdı.
// `lastName` modeldə MƏCBURİDİR — validasiya düşürdü, hesab yaranmırdı və
// istifadəçi «Invalid email or password» görürdü. Səbəb isə tamam başqa
// yerdə idi, ona görə tapmaq çətin oldu.

/** Sənədi doğrula, xəta obyektini qaytar (yoxdursa null).
 *  validateSync() köhnəlib və CI log-unu xəbərdarlıqla doldurur. */
const validate = async (doc) => {
  try {
    await doc.validate();
    return null;
  } catch (err) {
    return err;
  }
};

const base = {
  email: "x@y.az",
  password: "hashed",
  role: "developer",
  status: "active",
};

describe("User yaradılışı — məcburi sahələr", () => {
  it("boş lastName QƏBUL EDİLMİR", async () => {
    const u = new User({ ...base, firstName: "Developer", lastName: "" });
    const err = await validate(u);
    expect(err?.errors?.lastName).toBeDefined();
  });

  it("boş firstName qəbul edilmir", async () => {
    const u = new User({ ...base, firstName: "", lastName: "Hesabı" });
    expect((await validate(u))?.errors?.firstName).toBeDefined();
  });

  it("developer hesabının real dəyərləri validasiyadan keçir", async () => {
    // BootstrapService və adminDoctor-un işlətdiyi dəyərlər.
    const u = new User({
      firstName: "Developer",
      lastName: "Hesabı",
      email: "developer@britishacademy.az",
      password: "hashed",
      role: "developer",
      status: "active",
    });
    expect(await validate(u)).toBeNull();
  });

  it("admin hesabının dəyərləri validasiyadan keçir", async () => {
    const u = new User({
      firstName: "Default",
      lastName: "Admin",
      email: "admin@britishacademy.az",
      password: "hashed",
      role: "admin",
      status: "active",
    });
    expect(await validate(u)).toBeNull();
  });

  it("developer rolu enum-da mövcuddur", async () => {
    const u = new User({ ...base, firstName: "D", lastName: "H" });
    expect((await validate(u))?.errors?.role).toBeUndefined();
  });

  it("superadmin rolu enum-da mövcuddur", async () => {
    const u = new User({ ...base, role: "superadmin", firstName: "S", lastName: "A" });
    expect((await validate(u))?.errors?.role).toBeUndefined();
  });
});
