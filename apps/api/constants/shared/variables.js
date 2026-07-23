import { mongoose, ExpressRouter } from "#lib";

const Schema = mongoose.Schema;
const Model = mongoose.model;
const Router = () => ExpressRouter();

// Roles allowed into the admin dashboard / write endpoints.
const adminRoles = ["admin", "editor"];

export { Schema, Model, Router, adminRoles };
