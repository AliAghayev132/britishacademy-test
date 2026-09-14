// Admin handler-lərinin toplayıcısı — marşrutlar `adminController.*` adları
// ilə bağlanır, məntiq isə controllers/admin/ altındadır.
// Müraciət sərhədi (leadInReach, applyLeadScope…) → services/LeadAccessService.js.

export { list, getOne, create, update, remove, reorder } from "./admin/crudController.js";
export { getSettings, updateSettings } from "./admin/settingsController.js";
export { stats } from "./admin/dashboardController.js";
