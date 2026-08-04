/**
 * API Service for Backend Communication
 * Handles all HTTP requests to the Spring Boot backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  const token = localStorage.getItem("token");

  // Log the request URL for debugging
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : 'Request object';
  console.log(`🌐 [API_REQ] ${init.method || 'GET'} ${url}`);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log(`🔑 [API_AUTH] Bearer token attached`);
  } else if (!token) {
    console.warn("⚠️ [API_WARN] No token found in localStorage");
  }

  try {
    const response = await fetch(input, { ...init, headers });

    // Handle 401 Unauthorized - redirect to login only if not already on login page
    if (response.status === 401) {
      console.error("🚫 [API_ERR] 401 Unauthorized - Token invalid or expired");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (response.ok) {
      console.log(`✅ [API_RES] ${response.status} ${response.statusText}`);
    } else {
      console.error(`❌ [API_FAIL] ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("🚨 [API_FETCH_ERR]", error);
    throw error;
  }
};

/**
 * Throws with the backend's own message (e.g. a 409 conflict reason) when the
 * response isn't ok, falling back to `fallback` only if the body can't be
 * parsed as JSON (e.g. a network-level failure). 403s are normalized to a
 * plain "Unauthorized" — the backend's "Permission denied" / "Super Admin
 * only" wording is meant for API consumers, not this user-facing toast text.
 */
const throwIfError = async (response: Response, fallback: string): Promise<void> => {
  if (response.ok) return;
  if (response.status === 403) throw new Error('Unauthorized');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error: any = await response.json().catch(() => ({}));
  throw new Error(error?.message || fallback);
};

export const apiClient = {
  /**
   * Auth API
   */
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      await throwIfError(response, 'Invalid credentials');
      return response.json();
    },
    me: async () => {
      const response = await authFetch(`${API_BASE_URL}/auth/me`);
      await throwIfError(response, 'Failed to fetch current user');
      return response.json();
    },
  },

  /**
   * Health Check
   */
  health: {
    check: async () => {
      const response = await authFetch(`${API_BASE_URL}/health`);
      await throwIfError(response, 'Health check failed');
      return response.json();
    },
    info: async () => {
      const response = await authFetch(`${API_BASE_URL}/health/info`);
      await throwIfError(response, 'Health info failed');
      return response.json();
    },
  },

  /**
   * Users API
   */
  users: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/users`);
      await throwIfError(response, 'Failed to fetch users');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/users/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch users');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/${id}`);
      await throwIfError(response, 'Failed to fetch user');
      return response.json();
    },
    getByEmail: async (email: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/email/${email}`);
      await throwIfError(response, 'Failed to fetch user by email');
      return response.json();
    },
    getByRole: async (role: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/role/${role}`);
      await throwIfError(response, 'Failed to fetch users by role');
      return response.json();
    },
    getDashboardStatsAdmin: async () => {
      const response = await authFetch(`${API_BASE_URL}/users/dashboard-stats/admin`);
      await throwIfError(response, 'Failed to fetch admin dashboard stats');
      return response.json();
    },
    getByBranch: async (branchId: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/branch/${branchId}`);
      await throwIfError(response, 'Failed to fetch users by branch');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create user');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/users/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update user');
      return response.json();
    },
    setPin: async (userId: string, pin: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/${userId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      await throwIfError(response, 'Failed to set PIN');
      return response.json();
    },
    verifyPin: async (userId: string, pin: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/${userId}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      await throwIfError(response, 'Failed to verify PIN');
      return response.json();
    },
    hasPinSet: async (userId: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/${userId}/has-pin`);
      await throwIfError(response, 'Failed to check PIN');
      return response.json();
    },
    verifyManagerPin: async (email: string, pin: string, action: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/verify-manager-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, action }),
      });
      await throwIfError(response, 'Failed to verify manager PIN');
      return response.json();
    },

    filter: async (name?: string, email?: string, role?: string | string[], branch?: string, page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (email) params.append('email', email);
      if (role && role !== 'all') {
        if (Array.isArray(role)) {
          role.forEach(r => params.append('role', r));
        } else {
          params.append('role', role);
        }
      }
      if (branch) params.append('branch', branch);
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await authFetch(`${API_BASE_URL}/users/filter?${params.toString()}`);
      await throwIfError(response, 'Failed to filter users');
      return response.json();
    },
  },

  /**
   * Roles API (Super Admin only, except the two reads)
   */
  roles: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/roles`);
      await throwIfError(response, 'Failed to fetch roles');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/roles/${id}`);
      await throwIfError(response, 'Failed to fetch role');
      return response.json();
    },
    create: async (data: { name: string; label: string; description?: string }) => {
      const response = await authFetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create role');
      return response.json();
    },
    update: async (id: string, data: { name?: string; label?: string; description?: string; isActive?: boolean }) => {
      const response = await authFetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update role');
      return response.json();
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/roles/${id}`, { method: 'DELETE' });
      await throwIfError(response, 'Failed to delete role');
    },
    getPermissions: async (name: string) => {
      const response = await authFetch(`${API_BASE_URL}/roles/${encodeURIComponent(name)}/permissions`);
      await throwIfError(response, 'Failed to fetch role permissions');
      return response.json() as Promise<string[]>;
    },
    setPermissions: async (name: string, permissions: string[]) => {
      const response = await authFetch(`${API_BASE_URL}/roles/${encodeURIComponent(name)}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      await throwIfError(response, 'Failed to update role permissions');
      return response.json() as Promise<string[]>;
    },
  },

  /**
   * Permissions API
   */
  permissions: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/permissions`);
      await throwIfError(response, 'Failed to fetch permissions');
      return response.json();
    },
    getGrouped: async () => {
      const response = await authFetch(`${API_BASE_URL}/permissions/grouped`);
      await throwIfError(response, 'Failed to fetch grouped permissions');
      return response.json() as Promise<Record<string, { id: string; key: string; module: string; label: string }[]>>;
    },
  },

  /**
   * Branches API
   */
  branches: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/branches`);
      await throwIfError(response, 'Failed to fetch branches');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'name', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/branches/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch branches');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/branches/active`);
      await throwIfError(response, 'Failed to fetch active branches');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/branches/${id}`);
      await throwIfError(response, 'Failed to fetch branch');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create branch');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update branch');
      return response.json();
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE',
      });
      await throwIfError(response, 'Failed to delete branch');
    },
  },

  /**
   * Interest Rates API
   */
  interestRates: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates`);
      await throwIfError(response, 'Failed to fetch interest rates');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/active`);
      await throwIfError(response, 'Failed to fetch active interest rates');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}`);
      await throwIfError(response, 'Failed to fetch interest rate');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create interest rate');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update interest rate');
      return response.json();
    },
    toggleActive: async (id: string, replacementDefaultRateId?: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replacementDefaultRateId ? { replacementDefaultRateId } : {}),
      });
      await throwIfError(response, 'Failed to toggle interest rate status');
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}`, {
        method: 'DELETE',
      });
      await throwIfError(response, 'Failed to delete interest rate');
    },
  },

  /**
   * Item Types API
   */
  itemTypes: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/item-types`);
      await throwIfError(response, 'Failed to fetch item types');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/item-types/active`);
      await throwIfError(response, 'Failed to fetch active item types');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/item-types/${id}`);
      await throwIfError(response, 'Failed to fetch item type');
      return response.json();
    },
    search: async (filters: {
      page?: number;
      size?: number;
      name?: string;
      isActive?: boolean | null;
      sortBy?: string;
      sortDir?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters.page !== undefined) params.append('page', String(filters.page));
      if (filters.size !== undefined) params.append('size', String(filters.size));
      if (filters.name) params.append('name', filters.name);
      if (filters.isActive !== null && filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortDir) params.append('sortDir', filters.sortDir);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/item-types/search${queryString ? '?' + queryString : ''}`;

      const response = await authFetch(url);
      await throwIfError(response, 'Failed to search item types');
      return response.json();
    },
    create: async (data: { name: string; description?: string | null; createdBy?: string }) => {
      const response = await authFetch(`${API_BASE_URL}/item-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create item type');
      return response.json();
    },
    update: async (id: string, data: { name: string; description?: string | null }) => {
      const response = await authFetch(`${API_BASE_URL}/item-types/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update item type');
      return response.json();
    },
    toggleActive: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/item-types/${id}/toggle-active`, {
        method: 'PATCH',
      });
      await throwIfError(response, 'Failed to toggle item type status');
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/item-types/${id}`, {
        method: 'DELETE',
      });
      await throwIfError(response, 'Failed to delete item type');
    },
  },

  /**
   * Blacklist API
   */
  blacklist: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/blacklist`);
      await throwIfError(response, 'Failed to fetch blacklist');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'createdAt', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch blacklist');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/active`);
      await throwIfError(response, 'Failed to fetch active blacklist');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}`);
      await throwIfError(response, 'Failed to fetch blacklist entry');
      return response.json();
    },
    getByBranch: async (branchId: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/branch/${branchId}`);
      await throwIfError(response, 'Failed to fetch blacklist by branch');
      return response.json();
    },
    checkByNic: async (nic: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/check/${nic}`);
      await throwIfError(response, 'Failed to check NIC');
      return response.json();
    },
    verifyNic: async (nic: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/verify/${nic}`);
      await throwIfError(response, 'Failed to verify NIC');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create blacklist entry');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update blacklist entry');
      return response.json();
    },
    toggleActive: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}/toggle-active`, {
        method: 'PATCH',
      });
      await throwIfError(response, 'Failed to toggle blacklist status');
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}`, {
        method: 'DELETE',
      });
      await throwIfError(response, 'Failed to delete blacklist entry');
    },

    filter: async (nic?: string, policeReport?: string, status?: string, page: number = 0, size: number = 10, sortBy: string = 'createdAt', sortDir: string = 'desc') => {
      const params = new URLSearchParams();
      if (nic) params.append('nic', nic);
      if (policeReport) params.append('policeReport', policeReport);
      if (status && status !== 'all') {
        if (Array.isArray(status)) {
          status.forEach(s => params.append('status', s));
        } else {
          params.append('status', status);
        }
      }
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await authFetch(`${API_BASE_URL}/blacklist/filter?${params.toString()}`);
      await throwIfError(response, 'Failed to filter blacklist');
      return response.json();
    },
  },

  /**
   * Pawn Transactions API
   */
  pawnTransactions: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions`);
      await throwIfError(response, 'Failed to fetch transactions');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch transactions');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}`);
      await throwIfError(response, 'Failed to fetch transaction');
      return response.json();
    },
    getByPawnId: async (pawnId: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/pawn-id/${pawnId}`);
      await throwIfError(response, 'Failed to fetch transaction');
      return response.json();
    },
    getByBranch: async (branchId: string, page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/branch/${branchId}/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch transactions by branch');
      return response.json();
    },
    getByStatus: async (status: string, page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/status/${status}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch transactions by status');
      return response.json();
    },
    search: async (query: string, branchId?: string, page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const branchParam = branchId ? `&branchId=${branchId}` : '';
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/search?query=${encodeURIComponent(query)}${branchParam}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to search transactions');
      return response.json();
    },
    searchAdvanced: async (params: {
      itemTypeName?: string;
      customerNic?: string;
      status?: string | string[];
      minAmount?: number;
      maxAmount?: number;
      patternMode?: string;
      startDate?: string;
      endDate?: string;
      filterBranchId?: string;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.itemTypeName) queryParams.append('itemTypeName', params.itemTypeName);
      if (params.customerNic) queryParams.append('customerNic', params.customerNic);
      if (params.status) {
        if (Array.isArray(params.status)) {
          params.status.forEach(s => queryParams.append('status', s));
        } else {
          queryParams.append('status', params.status);
        }
      }
      if (params.minAmount !== undefined) queryParams.append('minAmount', params.minAmount.toString());
      if (params.maxAmount !== undefined) queryParams.append('maxAmount', params.maxAmount.toString());
      if (params.patternMode) queryParams.append('patternMode', params.patternMode);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.filterBranchId) queryParams.append('filterBranchId', params.filterBranchId);
      queryParams.append('page', (params.page || 0).toString());
      queryParams.append('size', (params.size || 10).toString());
      queryParams.append('sortBy', params.sortBy || 'pawnDate');
      queryParams.append('sortDir', params.sortDir || 'desc');

      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/search/advanced?${queryParams.toString()}`);
      await throwIfError(response, 'Failed to search transactions');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create transaction');
      return response.json();
    },
    updateStatus: async (id: string, status: string, reason?: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      await throwIfError(response, 'Failed to update transaction status');
      return response.json();
    },
    updateRemarks: async (id: string, remarks: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/remarks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      await throwIfError(response, 'Failed to update transaction remarks');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateBlockReason: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/block-reason`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update transaction block reason');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateDetails: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to update transaction details');
      return response.json();
    },
    getHistory: async (id: string, limit: number = 10) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/edit-history?limit=${limit}`);
      await throwIfError(response, 'Failed to fetch transaction history');
      return response.json();
    },
    getPatternConfig: async () => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/pattern-config`);
      await throwIfError(response, 'Failed to fetch pattern config');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setProfit: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/profit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to set transaction profit');
      return response.json();
    },
    getProfitByTransactionId: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/profit`);
      await throwIfError(response, 'Failed to fetch profit record');
      return response.json();
    },
  },

  /**
   * Pawn Redemptions API
   */
  pawnRedemptions: {
    getByTransaction: async (transactionId: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-redemptions/transaction/${transactionId}`);
      await throwIfError(response, 'Failed to fetch redemptions');
      return response.json();
    },
    getOutstandingBalance: async (transactionId: string, calculationPeriod?: 'MONTHLY' | 'TWO_WEEKS') => {
      const qs = calculationPeriod ? `?calculationPeriod=${calculationPeriod}` : '';
      const response = await authFetch(`${API_BASE_URL}/pawn-redemptions/outstanding-balance/${transactionId}${qs}`);
      await throwIfError(response, 'Failed to fetch outstanding balance');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processRedemption: async (transactionId: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-redemptions/${transactionId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to process redemption');
      return response.json();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-redemptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await throwIfError(response, 'Failed to create redemption');
      return response.json();
    },
  },

  /**
   * Image Upload API
   */
  images: {
    uploadSingle: async (file: File, transactionId: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transactionId', transactionId);

      const response = await authFetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        body: formData,
      });

      await throwIfError(response, 'Failed to upload image');
      return response.json();
    },

    uploadMultiple: async (files: File[], transactionId: string) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('transactionId', transactionId);

      const response = await authFetch(`${API_BASE_URL}/images/upload-multiple`, {
        method: 'POST',
        body: formData,
      });

      await throwIfError(response, 'Failed to upload images');
      return response.json();
    },

    delete: async (imageUrl: string) => {
      const response = await authFetch(`${API_BASE_URL}/images/delete?url=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      });
      await throwIfError(response, 'Failed to delete image');
      return response.json();
    },
  },

  /**
   * Customers API
   */
  customers: {
    getAll: async (page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/customers?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch customers');
      return response.json();
    },

    search: async (query: string, page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/customers/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to search customers');
      return response.json();
    },

    getByNic: async (nic: string) => {
      const response = await authFetch(`${API_BASE_URL}/customers/nic/${nic}`);
      await throwIfError(response, 'Customer not found');
      return response.json();
    },

    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/customers/${id}`);
      await throwIfError(response, 'Customer not found');
      return response.json();
    },

    getByType: async (type: string, page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/customers/type/${type}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch customers by type');
      return response.json();
    },

    checkNicExists: async (nic: string) => {
      const response = await authFetch(`${API_BASE_URL}/customers/check-nic/${nic}`);
      await throwIfError(response, 'Failed to check NIC');
      return response.json();
    },

    filter: async (nic?: string, phone?: string, status?: string | string[], page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc', name?: string) => {
      const params = new URLSearchParams();
      if (nic) params.append('nic', nic);
      if (phone) params.append('phone', phone);
      if (name) params.append('name', name);
      if (status && status !== 'all') {
        if (Array.isArray(status)) {
          status.forEach(s => params.append('status', s));
        } else {
          params.append('status', status);
        }
      }
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await authFetch(`${API_BASE_URL}/customers/filter?${params.toString()}`);
      await throwIfError(response, 'Failed to filter customers');
      return response.json();
    },

    searchAdvanced: async (nic?: string, phone?: string, name?: string, customerType?: string, status?: string | string[], page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const params = new URLSearchParams();
      if (nic) params.append('nic', nic);
      if (phone) params.append('phone', phone);
      if (name) params.append('name', name);
      if (customerType) params.append('customerType', customerType);
      if (status && status !== 'all') {
        if (Array.isArray(status)) {
          status.forEach(s => params.append('status', s));
        } else {
          params.append('status', status);
        }
      }
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await authFetch(`${API_BASE_URL}/customers/search/advanced?${params.toString()}`);
      await throwIfError(response, 'Failed to perform advanced search');
      return response.json();
    },
  },

  /**
   * Profited Transactions API
   */
  profitedTransactions: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/profited-transactions`);
      await throwIfError(response, 'Failed to fetch profited transactions');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'profitRecordedDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/profited-transactions/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      await throwIfError(response, 'Failed to fetch profited transactions');
      return response.json();
    },
    search: async (pawnId?: string, customerNic?: string, page: number = 0, size: number = 10, sortBy: string = 'profitRecordedDate', sortDir: string = 'desc') => {
      const params = new URLSearchParams();
      if (pawnId) params.append('pawnId', pawnId);
      if (customerNic) params.append('customerNic', customerNic);
      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await authFetch(`${API_BASE_URL}/profited-transactions/search?${params.toString()}`);
      await throwIfError(response, 'Failed to search profited transactions');
      return response.json();
    },
  },

  /**
   * Activity Logs API
   */
  activityLogs: {
    search: async (userName?: string, action?: string, page: number = 0, size: number = 20) => {
      const params = new URLSearchParams();
      if (userName) params.append('userName', userName);
      if (action) params.append('action', action);
      params.append('page', String(page));
      params.append('size', String(size));
      const response = await authFetch(`${API_BASE_URL}/activity-logs?${params.toString()}`);
      await throwIfError(response, 'Failed to fetch activity logs');
      return response.json();
    },
  },
};

export default apiClient;