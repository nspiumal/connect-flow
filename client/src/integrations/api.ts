/**
 * API Service for Backend Communication
 * Handles all HTTP requests to the Spring Boot backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  const token = localStorage.getItem("token");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
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
      if (!response.ok) throw new Error('Invalid credentials');
      return response.json();
    },
  },

  /**
   * Health Check
   */
  health: {
    check: async () => {
      const response = await authFetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    info: async () => {
      const response = await authFetch(`${API_BASE_URL}/health/info`);
      if (!response.ok) throw new Error('Health info failed');
      return response.json();
    },
  },

  /**
   * Users API
   */
  users: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'fullName', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/users/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    getByEmail: async (email: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/email/${email}`);
      if (!response.ok) throw new Error('Failed to fetch user by email');
      return response.json();
    },
    getByRole: async (role: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/role/${role}`);
      if (!response.ok) throw new Error('Failed to fetch users by role');
      return response.json();
    },
    getByBranch: async (branchId: string) => {
      const response = await authFetch(`${API_BASE_URL}/users/branch/${branchId}`);
      if (!response.ok) throw new Error('Failed to fetch users by branch');
      return response.json();
    },
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
  },

  /**
   * Branches API
   */
  branches: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/branches`);
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'name', sortDir: string = 'asc') => {
      const response = await authFetch(`${API_BASE_URL}/branches/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/branches/active`);
      if (!response.ok) throw new Error('Failed to fetch active branches');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/branches/${id}`);
      if (!response.ok) throw new Error('Failed to fetch branch');
      return response.json();
    },
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create branch');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update branch');
      return response.json();
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete branch');
    },
  },

  /**
   * Interest Rates API
   */
  interestRates: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates`);
      if (!response.ok) throw new Error('Failed to fetch interest rates');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/active`);
      if (!response.ok) throw new Error('Failed to fetch active interest rates');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}`);
      if (!response.ok) throw new Error('Failed to fetch interest rate');
      return response.json();
    },
    getByCustomerType: async (type: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/customer-type/${type}`);
      if (!response.ok) throw new Error('Failed to fetch interest rates by customer type');
      return response.json();
    },
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create interest rate');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update interest rate');
      return response.json();
    },
    toggleActive: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}/toggle-active`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle interest rate status');
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/interest-rates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete interest rate');
    },
  },

  /**
   * Blacklist API
   */
  blacklist: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/blacklist`);
      if (!response.ok) throw new Error('Failed to fetch blacklist');
      return response.json();
    },
    getActive: async () => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/active`);
      if (!response.ok) throw new Error('Failed to fetch active blacklist');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}`);
      if (!response.ok) throw new Error('Failed to fetch blacklist entry');
      return response.json();
    },
    getByBranch: async (branchId: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/branch/${branchId}`);
      if (!response.ok) throw new Error('Failed to fetch blacklist by branch');
      return response.json();
    },
    checkByNic: async (nic: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/check/${nic}`);
      if (!response.ok) throw new Error('Failed to check NIC');
      return response.json();
    },
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create blacklist entry');
      return response.json();
    },
    update: async (id: string, data: any) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update blacklist entry');
      return response.json();
    },
    toggleActive: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}/toggle-active`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle blacklist status');
    },
    delete: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/blacklist/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete blacklist entry');
    },
  },

  /**
   * Pawn Transactions API
   */
  pawnTransactions: {
    getAll: async () => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    getPaginated: async (page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    getById: async (id: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');
      return response.json();
    },
    getByPawnId: async (pawnId: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/pawn-id/${pawnId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');
      return response.json();
    },
    getByBranch: async (branchId: string, page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/branch/${branchId}/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      if (!response.ok) throw new Error('Failed to fetch transactions by branch');
      return response.json();
    },
    getByStatus: async (status: string, page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/status/${status}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      if (!response.ok) throw new Error('Failed to fetch transactions by status');
      return response.json();
    },
    search: async (query: string, branchId?: string, page: number = 0, size: number = 10, sortBy: string = 'pawnDate', sortDir: string = 'desc') => {
      const branchParam = branchId ? `&branchId=${branchId}` : '';
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/search?query=${encodeURIComponent(query)}${branchParam}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
      if (!response.ok) throw new Error('Failed to search transactions');
      return response.json();
    },
    create: async (data: any) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transaction');
      return response.json();
    },
    updateStatus: async (id: string, status: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update transaction status');
      return response.json();
    },
    updateRemarks: async (id: string, remarks: string) => {
      const response = await authFetch(`${API_BASE_URL}/pawn-transactions/${id}/remarks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      if (!response.ok) throw new Error('Failed to update transaction remarks');
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

      const token = localStorage.getItem("token");
      const headers = new Headers();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    },

    uploadMultiple: async (files: File[], transactionId: string) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('transactionId', transactionId);

      const token = localStorage.getItem("token");
      const headers = new Headers();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}/images/upload-multiple`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload images');
      return response.json();
    },

    delete: async (imageUrl: string) => {
      const response = await authFetch(`${API_BASE_URL}/images/delete?url=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete image');
      return response.json();
    },
  },
};

export default apiClient;
