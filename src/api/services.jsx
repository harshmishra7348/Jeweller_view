import { publicHttp, adminHttp, customerHttp, unwrap } from "./http";
import { STORAGE, DEFAULT_HOME_SETTINGS } from "../config";

/* ----------------------------- Public storefront ---------------------------- */

export const storefront = {
  listProducts: async () =>
    unwrap(await publicHttp.get("/public/itemMST/getAllActive")),

  getProduct: async (id) =>
    unwrap(await publicHttp.get(`/public/itemMST/byId/${id}`)),

  searchProducts: async (key) =>
    unwrap(await publicHttp.get("/itemMST/search", { params: { key }, skipLoader: true })),
};

/* ------------------------- Public site content (CMS) ------------------------ */

const HOME_SETTINGS_STORAGE_KEY = STORAGE.homeSettings;
let pendingHomeSettingsRequest = null;

function readCachedHomeSettings() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HOME_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedHomeSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HOME_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures.
  }
}

function clearHomeSettingsCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HOME_SETTINGS_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export const content = {
  // [{ id, title, displayOrder, active, imageUrl }]
  homeImages: async () => unwrap(await publicHttp.get("/public/home/images")),
  // [{ id, mainHeading, subHeading, description, displayOrder, imageUrl }]
  about: async () => unwrap(await publicHttp.get("/public/about")),
  // { phone, alternatePhone, email, address, city, state, pincode, mapUrl, whatsapp, facebook, instagram, website }
  contact: async () => unwrap(await publicHttp.get("/public/contact")),
  // { heroBgColor, heroTextColor, heroAccentColor, pageBgColor,
  //   headerBgColor, headerPrimaryFontColor, headerSecondaryFontColor,
  //   headerSelectedItemColor, headerHoverItemColor,
  //   footerBgColor, footerPrimaryFontColor, footerSecondaryFontColor,
  //   footerSelectedItemColor, footerHoverItemColor }
  homeSettings: async () => {
    const cached = readCachedHomeSettings();
    if (cached) {
      return { ...DEFAULT_HOME_SETTINGS, ...cached };
    }

    try {
      const data = unwrap(await publicHttp.get("/public/home/settings"));
      const settings = { ...DEFAULT_HOME_SETTINGS, ...(data || {}) };
      writeCachedHomeSettings(settings);
      return settings;
    } catch {
      return cached ? { ...DEFAULT_HOME_SETTINGS, ...cached } : DEFAULT_HOME_SETTINGS;
    }
  },
};

/* --------------------- Customer: server-side inquiry cart ------------------- */

export const profile = {
  // Current user (name, email, phoneNumber, address, merchant).
  get: async () => unwrap(await customerHttp.get("/profile")),
  // Email & role are immutable server-side; only name/phone/address are applied.
  update: async ({ name, phoneNumber, address }) =>
    unwrap(await customerHttp.put("/profile", { name, phoneNumber, address })),
  changePassword: async (oldPassword, newPassword) =>
    unwrap(await customerHttp.put("/profile/changePassword", { oldPassword, newPassword })),
};

export const enquiryCart = {
  get: async () => unwrap(await customerHttp.get("/enquiry/cart")),

  add: async (itemMSTId, quantity) =>
    unwrap(await customerHttp.post("/enquiry/cart/add", { itemMSTId, quantity })),

  setQuantity: async (itemMSTId, quantity) =>
    unwrap(
      await customerHttp.put("/enquiry/cart/quantity", null, {
        params: { itemMSTId, quantity },
      })
    ),

  remove: async (itemMSTId) =>
    unwrap(await customerHttp.delete(`/enquiry/cart/remove/${itemMSTId}`)),

  submit: async (message) =>
    unwrap(await customerHttp.post("/enquiry/cart/submit", { message })),
};

/* --------------------------------- Auth ------------------------------------- */

export const auth = {
  // Returns a JWT string on success.
  login: async (username, password) =>
    unwrap(await publicHttp.post("/userMST/login", { username, password })),

  // UserMST: { name, companyName, address, phoneNumber, email, password, merchant }
  register: async (user) =>
    unwrap(await publicHttp.post("/userMST/create", user)),
};

export const adminProfile = {
  get: async () => unwrap(await adminHttp.get("/profile")),
  update: async ({ name, companyName, phoneNumber, address }) =>
    unwrap(await adminHttp.put("/profile", { name, companyName, phoneNumber, address })),
  changePassword: async (oldPassword, newPassword) =>
    unwrap(await adminHttp.put("/profile/changePassword", { oldPassword, newPassword })),
  createAdmin: async (user) =>
    unwrap(await adminHttp.post("/userMST/createAdmin", { ...user, merchant: true, admin: true })),
};

/* --------------------------- Admin: products -------------------------------- */

export const adminProducts = {
  list: async () => unwrap(await adminHttp.get("/itemMST/getAll")),

  search: async (key) => unwrap(await adminHttp.get("/itemMST/search", { params: { key }, skipLoader: true })),

  getById: async (id) => unwrap(await adminHttp.get(`/itemMST/byId/${id}`)),

  create: async (item, imageFile) => {
    const form = new FormData();
    form.append(
      "item",
      new Blob([JSON.stringify(item)], { type: "application/json" })
    );
    if (imageFile) form.append("image", imageFile);
    return unwrap(await adminHttp.post("/itemMST/create", form));
  },

  update: async (item, imageFile) => {
    const form = new FormData();
    form.append(
      "item",
      new Blob([JSON.stringify(item)], { type: "application/json" })
    );
    if (imageFile) form.append("image", imageFile);
    return unwrap(await adminHttp.put("/itemMST/update", form));
  },

  remove: async (id) => unwrap(await adminHttp.delete(`/itemMST/delete/${id}`)),

  adjustStock: async (itemMSTId, delta) =>
    unwrap(
      await adminHttp.put("/itemMST/adjustStock", null, {
        params: { itemMSTId, delta },
      })
    ),

  lowStock: async (threshold = 10) =>
    unwrap(await adminHttp.get("/itemMST/lowStock", { params: { threshold } })),
};

/* --------------------------- Admin: purchases ------------------------------- */

export const adminPurchases = {
  list: async () => unwrap(await adminHttp.get("/purchaseMST/getAll")),

  // { supplierName, supplierGst, address, tax, items:[{itemMSTId, quantity, costPrice}] }
  create: async (payload) =>
    unwrap(await adminHttp.post("/purchaseMST/create", payload)),

  remove: async (id) =>
    unwrap(await adminHttp.delete(`/purchaseMST/delete/${id}`)),

  exportExcel: async () =>
    (
      await adminHttp.get("/purchaseMST/export/excel", { responseType: "blob" })
    ).data,
};

/* ---------------------------- Admin: sales/invoices ------------------------- */

export const adminSales = {
  list: async () => unwrap(await adminHttp.get("/invoiceMST/getAll")),

  search: async (key) => unwrap(await adminHttp.get("/invoiceMST/search", { params: { key }, skipLoader: true })),

  // { itemMSTS:[{id, quantity, price}], userMSTId, transportMSTId, address, gstNumber, tax, labour, discount }
  create: async (payload) =>
    unwrap(await adminHttp.post("/invoiceMST/create", payload)),

  updateStatus: async (invoiceMSTId, invoiceStatus) =>
    unwrap(
      await adminHttp.put("/invoiceMST/updateStatus", null, {
        params: { invoiceMSTId, invoiceStatus },
      })
    ),

  resendMail: async (id) =>
    unwrap(await adminHttp.post(`/invoiceMST/sendMail/${id}`)),
  sendTransportMail: async (id, email) =>
    unwrap(await adminHttp.get(`/invoiceMST/sendMailToCustom?invoiceMSTId=${id}&email=${email}`)),

  downloadPdf: async (id) =>
    (
      await adminHttp.get(`/invoiceMST/download/${id}`, { responseType: "blob" })
    ).data,

  exportExcel: async () =>
    (
      await adminHttp.get("/invoiceMST/export/excel", { responseType: "blob" })
    ).data,
};

/* ----------------------------- Admin: customers ----------------------------- */

export const adminCustomers = {
  list: async () => unwrap(await adminHttp.get("/userMST/getAllActive")),
  // Registration endpoint is public; reused by admin to add a customer.
  // User can include { name, companyName, address, phoneNumber, email, password, merchant }
  create: async (user) => unwrap(await publicHttp.post("/userMST/create", user)),
};

/* ----------------------------- Admin: enquiries ----------------------------- */

export const adminEnquiries = {
  list: async () => unwrap(await adminHttp.get("/enquiry/getAll")),
  unresolved: async () => unwrap(await adminHttp.get("/enquiry/unresolved")),
  resolve: async (id) => unwrap(await adminHttp.put(`/enquiry/resolve/${id}`)),
};

/* -------------------- Admin: home banner images (CMS) ----------------------- */

export const adminHomeImages = {
  list: async () => unwrap(await adminHttp.get("/homeImage/getAll")),

  create: async ({ title, displayOrder, imageFile }) => {
    const form = new FormData();
    if (title != null) form.append("title", title);
    if (displayOrder != null && displayOrder !== "") form.append("displayOrder", displayOrder);
    form.append("image", imageFile);
    return unwrap(await adminHttp.post("/homeImage/create", form));
  },

  update: async ({ id, title, displayOrder, imageFile }) => {
    const form = new FormData();
    form.append("id", id);
    if (title != null) form.append("title", title);
    if (displayOrder != null && displayOrder !== "") form.append("displayOrder", displayOrder);
    if (imageFile) form.append("image", imageFile);
    return unwrap(await adminHttp.put("/homeImage/update", form));
  },

  remove: async (id) => unwrap(await adminHttp.delete(`/homeImage/delete/${id}`)),
};

/* -------------------- Admin: About Us sections (CMS) ------------------------ */

export const adminAbout = {
  list: async () => unwrap(await adminHttp.get("/about/getAll")),

  create: async ({ mainHeading, subHeading, description, displayOrder, imageFile }) => {
    const form = new FormData();
    form.append("mainHeading", mainHeading);
    if (subHeading != null) form.append("subHeading", subHeading);
    if (description != null) form.append("description", description);
    if (displayOrder != null && displayOrder !== "") form.append("displayOrder", displayOrder);
    if (imageFile) form.append("image", imageFile);
    return unwrap(await adminHttp.post("/about/create", form));
  },

  update: async ({ id, mainHeading, subHeading, description, displayOrder, imageFile }) => {
    const form = new FormData();
    form.append("id", id);
    form.append("mainHeading", mainHeading);
    if (subHeading != null) form.append("subHeading", subHeading);
    if (description != null) form.append("description", description);
    if (displayOrder != null && displayOrder !== "") form.append("displayOrder", displayOrder);
    if (imageFile) form.append("image", imageFile);
    return unwrap(await adminHttp.put("/about/update", form));
  },

  remove: async (id) => unwrap(await adminHttp.delete(`/about/delete/${id}`)),
};

/* -------------------- Admin: contact details (CMS) ------------------------- */

export const adminContact = {
  get: async () => unwrap(await adminHttp.get("/contact")),
  save: async (contact) => unwrap(await adminHttp.post("/contact/save", contact)),
};

/* -------------------- Admin: home appearance (hero colour) ----------------- */

export const adminHomeSettings = {
  get: async () => unwrap(await adminHttp.get("/homeSetting")),
  save: async (settings) => {
    const result = unwrap(await adminHttp.post("/homeSetting/save", settings));
    clearHomeSettingsCache();
    return result;
  },
};

/* -------------------- Admin: Transport Master (CRUD) ----------------------- */

export const adminTransport = {
  list: async () => unwrap(await adminHttp.get("/api/v1/transport/all")),

  create: async ({ transportName, transportGst, transportAddress, transportContact }) => {
    return unwrap(await adminHttp.post("/api/v1/transport/create", {
      transportName,
      transportGst,
      transportAddress,
      transportContact,
    }));
  },

  update: async ({ id, transportName, transportGst, transportAddress, transportContact }) => {
    return unwrap(await adminHttp.put(`/api/v1/transport/update/${id}`, {
      transportName,
      transportGst,
      transportAddress,
      transportContact,
    }));
  },

  remove: async (id) => unwrap(await adminHttp.delete(`/api/v1/transport/delete/${id}`)),
};

/** Trigger a browser download for a Blob returned by an export/download call. */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
