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
};

export default apiClient;

