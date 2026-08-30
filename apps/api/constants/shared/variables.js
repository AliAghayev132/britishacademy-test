import { mongoose, ExpressRouter } from "#lib";

const Schema = mongoose.Schema;
const Model = mongoose.model;
const Router = () => ExpressRouter();

// Roles allowed into the admin dashboard / write endpoints.
// Admin panelinə giriş hüququ olan rollar. Bölmə səviyyəsindəki icazə
// ayrıca yoxlanılır (requireSection) — bu, yalnız «panelə girə bilər»dir.
const adminRoles = ["editor", "admin", "superadmin", "developer"];

export { Schema, Model, Router, adminRoles };
