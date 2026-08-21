import axios from "axios";
import { API_URL, STORAGE } from "../config";
import { startLoading, stopLoading } from "../loader/loaderService";

/**
 * Two axios instances:
 *  - `publicHttp`  : storefront + auth (no Authorization header).
 *  - `adminHttp`   : admin panel; injects the admin JWT and reacts to 401s.
 *
 * The backend wraps every JSON response in a GenericResponse:
 *   { data, message, status }  where `status` is a boolean success flag.
 * `unwrap()` turns that into either the payload or a thrown Error(message).
 */

export const publicHttp = axios.create({ baseURL: API_URL });

export const adminHttp = axios.create({ baseURL: API_URL });

/** Customer-authenticated instance: injects the storefront customer's JWT.
 *  Used for the server-side inquiry cart, which requires a logged-in user. */
export const customerHttp = axios.create({ baseURL: API_URL });

function readCustomerToken() {
  try {
    const raw = localStorage.getItem(STORAGE.customer);
    return raw ? JSON.parse(raw)?.token : null;
  } catch {
    return null;
  }
}

publicHttp.interceptors.request.use((config) => {
  if (!config.skipLoader) {
    startLoading();
  }
  return config;
});

publicHttp.interceptors.response.use(
  (res) => {
    if (!res.config?.skipLoader) {
      stopLoading();
    }
    return res;
  },
  (error) => {
    if (!error.config?.skipLoader) {
      stopLoading();
    }
    return Promise.reject(error);
  }
);

customerHttp.interceptors.request.use((config) => {
  startLoading();
  const token = readCustomerToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerHttp.interceptors.response.use(
  (res) => {
    stopLoading();
    return res;
  },
  (error) => {
    stopLoading();
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem(STORAGE.customer);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

adminHttp.interceptors.request.use((config) => {
  if (!config.skipLoader) {
    startLoading();
  }
  const token = localStorage.getItem(STORAGE.adminToken);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth is role-based (merchant => ADMIN authority). 401 = expired/invalid token;
// 403 = logged in but not a merchant. Either way, bounce to the admin login.
adminHttp.interceptors.response.use(
  (res) => {
    if (!res.config?.skipLoader) {
      stopLoading();
    }
    return res;
  },
  (error) => {
    if (!error.config?.skipLoader) {
      stopLoading();
    }
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem(STORAGE.adminToken);
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    return Promise.reject(error);
  }
);

/** Unwrap a GenericResponse, throwing a readable Error on failure. */
export function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "status" in body) {
    if (body.status === false) {
      throw new Error(body.message || "Request failed.");
    }
    return body.data;
  }
  return body;
}

/** Normalise any thrown error (axios / backend) into a single message string. */
export function errorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.status === 403) return "You don't have permission to do that.";
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return "Can't reach the server. Please make sure the backend is running.";
  }
  if (err?.message) return err.message;
  return "Something went wrong. Please try again.";
}
