import axios from "axios";

const API_BASE = "";
const TOKEN_KEY = "tal_auth_token";

// Helper to get/set JWT in localStorage
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------- AUTH ----------

const auth = {
  async signUp({ email, password, options }) {
    const { data: resp } = await axios.post(`${API_BASE}/api/auth/signup`, {
      email,
      password,
      options,
    });
    if (resp.data?.session?.access_token) {
      setToken(resp.data.session.access_token);
    }
    return resp; // { data: { user }, error }
  },

  async signInWithPassword({ email, password }) {
    const { data: resp } = await axios.post(`${API_BASE}/api/auth/login`, {
      email,
      password,
    });
    if (resp.data?.session?.access_token) {
      setToken(resp.data.session.access_token);
    }
    return resp; // { data: { user, session }, error }
  },

  async signOut() {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`);
    } catch {
      // ignore
    }
    setToken(null);
    return { error: null };
  },

  async getSession() {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };
    try {
      const { data: resp } = await axios.get(`${API_BASE}/api/auth/session`, {
        headers: authHeaders(),
      });
      return resp;
    } catch {
      setToken(null);
      return { data: { session: null }, error: null };
    }
  },

  async getUser() {
    const token = getToken();
    if (!token) return { data: { user: null }, error: { message: "Not authenticated" } };
    try {
      const { data: resp } = await axios.get(`${API_BASE}/api/auth/user`, {
        headers: authHeaders(),
      });
      return resp;
    } catch {
      return { data: { user: null }, error: { message: "Failed to get user" } };
    }
  },

  async updateUser({ password, data: metadata }) {
    try {
      const { data: resp } = await axios.put(
        `${API_BASE}/api/auth/user`,
        { password, data: metadata },
        { headers: authHeaders() }
      );
      return resp;
    } catch (err) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  async resetPasswordForEmail(email, options) {
    try {
      const { data: resp } = await axios.post(`${API_BASE}/api/auth/reset-password`, {
        email,
        redirectTo: options?.redirectTo,
      });
      return resp;
    } catch (err) {
      return { data: {}, error: { message: err.message } };
    }
  },

  async exchangeCodeForSession(url) {
    // For our token-based reset flow, extract token from URL and confirm
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");
    if (token) {
      // Store the reset token so ResetPassword page can use it
      localStorage.setItem("tal_reset_token", token);
    }
    // Return a session-like object so the flow continues
    return { data: { session: { user: {} } }, error: null };
  },
};

// ---------- QUERY BUILDER (mimics supabase.from().select().eq()...) ----------

// Map virtual table names to API endpoints
const TABLE_ENDPOINT_MAP = {
  student_form_submissions: "/api/student-forms",
  admin_student_info: "/api/admin/students",
  eligible_students: "/api/admin/eligible",
  non_eligible_students: "/api/admin/non-eligible",
  fee_payments: "/api/fee-payments",
  donor_mapping: "/api/donor-mappings",
  notifications: "/api/notifications",
  donations: "/api/donations",
  fee_structures: "/api/fee-structures",
  documents: "/api/documents",
  camps: "/api/camps",
  camp_participation: "/api/camp-participation",
  academic_records: "/api/academic-records",
};

class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._endpoint = TABLE_ENDPOINT_MAP[table] || `/api/${table}`;
    this._selectFields = "*";
    this._filters = {};
    this._orderField = null;
    this._orderAscending = false;
    this._isSingle = false;
    this._countOnly = false;
    this._headOnly = false;
    this._operation = null; // 'select', 'insert', 'update', 'delete'
    this._payload = null;
  }

  select(fields, options) {
    this._operation = "select";
    this._selectFields = fields || "*";
    if (options?.count === "exact" && options?.head) {
      this._countOnly = true;
      this._headOnly = true;
    }
    return this;
  }

  insert(payload) {
    this._operation = "insert";
    this._payload = payload;
    return this;
  }

  update(payload) {
    this._operation = "update";
    this._payload = payload;
    return this;
  }

  delete() {
    this._operation = "delete";
    return this;
  }

  eq(field, value) {
    this._filters[field] = value;
    return this;
  }

  order(field, options) {
    this._orderField = field;
    this._orderAscending = options?.ascending ?? false;
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  async then(resolve, reject) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: err.message } });
    }
  }

  async _execute() {
    const headers = authHeaders();

    switch (this._operation) {
      case "select": {
        // Count-only request
        if (this._countOnly) {
          const { data: resp } = await axios.get(this._endpoint, {
            params: { count_only: "true" },
            headers,
          });
          return { count: resp.count, data: resp.data, error: resp.error };
        }

        const params = {};
        if (this._selectFields && this._selectFields !== "*") {
          params.select = this._selectFields;
        }

        // Pass all eq filters as direct query params
        for (const [key, value] of Object.entries(this._filters)) {
          params[key] = value;
        }
        if (this._isSingle) {
          params.single = "true";
        }

        if (this._orderField) {
          params.order_field = this._orderField;
          params.order_ascending = String(this._orderAscending);
        }

        const { data: resp } = await axios.get(this._endpoint, { params, headers });
        return { data: resp.data, error: resp.error };
      }

      case "insert": {
        const payload = Array.isArray(this._payload)
          ? this._payload
          : [this._payload];
        const { data: resp } = await axios.post(this._endpoint, payload, { headers });
        return { data: resp.data, error: resp.error };
      }

      case "update": {
        const id = this._filters.id;
        if (!id) {
          return { data: null, error: { message: "Update requires an id filter via .eq('id', ...)" } };
        }
        const { data: resp } = await axios.put(`${this._endpoint}/${id}`, this._payload, { headers });
        return { data: resp.data, error: resp.error };
      }

      case "delete": {
        const deleteId = this._filters.id;
        if (!deleteId) {
          return { data: null, error: { message: "Delete requires an id filter via .eq('id', ...)" } };
        }
        const { data: resp } = await axios.delete(`${this._endpoint}/${deleteId}`, { headers });
        return { data: resp.data, error: resp.error };
      }

      default:
        return { data: null, error: { message: `Unknown operation: ${this._operation}` } };
    }
  }
}

// ---------- STORAGE ----------

const storageAdapter = {
  from(bucket) {
    return {
      async upload(filePath, file) {
        const formData = new FormData();
        formData.append("file", file);
        const folder = filePath.split("/")[0] || bucket;
        formData.append("folder", folder);
        try {
          const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return { data: { path: filePath }, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
      getPublicUrl(filePath) {
        const publicUrl = `${API_BASE}/uploads/${filePath}`;
        return { data: { publicUrl } };
      },
    };
  },
};

// ---------- MAIN EXPORT (mimics supabase client) ----------

const api = {
  auth,
  from(table) {
    return new QueryBuilder(table);
  },
  storage: storageAdapter,
};

export default api;
