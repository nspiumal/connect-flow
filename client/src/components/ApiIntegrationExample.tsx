/**
 * Example usage of the Backend API Client
 * This file demonstrates how to use the apiClient to communicate with the Spring Boot backend
 */

import { useState, useEffect } from 'react';
import apiClient from '@/integrations/api';

export function ApiIntegrationExample() {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example: Fetch all branches from backend
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.branches.getAll();
        setBranches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch branches');
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Example: Fetch all users from backend
  const handleFetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.users.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Example: Create a new branch
  const handleCreateBranch = async () => {
    try {
      setLoading(true);
      setError(null);
      const newBranch = await apiClient.branches.create({
        name: 'New Branch',
        address: '123 Main Street',
        phone: '+1-555-0000',
        isActive: true,
      });
      setBranches([...branches, newBranch]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  // Example: Update a branch
  const handleUpdateBranch = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await apiClient.branches.update(branchId, {
        name: 'Updated Branch Name',
      });
      setBranches(branches.map((b: any) => (b.id === branchId ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch');
    } finally {
      setLoading(false);
    }
  };

  // Example: Delete a branch
  const handleDeleteBranch = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.branches.delete(branchId);
      setBranches(branches.filter((b: any) => b.id !== branchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  // Example: Get branch by ID
  const handleGetBranch = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      const branch = await apiClient.branches.getById(branchId);
      console.log('Branch:', branch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branch');
    } finally {
      setLoading(false);
    }
  };

  // Example: Get active branches
  const handleGetActiveBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const active = await apiClient.branches.getActive();
      setBranches(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active branches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">API Integration Example</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && <p className="text-blue-600">Loading...</p>}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Branches</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCreateBranch}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Branch
          </button>
          <button
            onClick={handleGetActiveBranches}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Get Active Branches
          </button>
        </div>

        <div className="grid gap-2">
          {branches.map((branch: any) => (
            <div key={branch.id} className="border p-3 rounded bg-gray-50">
              <h3 className="font-semibold">{branch.name}</h3>
              <p className="text-sm text-gray-600">{branch.address}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleGetBranch(branch.id)}
                  className="px-2 py-1 bg-blue-500 text-white text-sm rounded"
                >
                  View
                </button>
                <button
                  onClick={() => handleUpdateBranch(branch.id)}
                  className="px-2 py-1 bg-yellow-500 text-white text-sm rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBranch(branch.id)}
                  className="px-2 py-1 bg-red-500 text-white text-sm rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          onClick={handleFetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load Users
        </button>

        <div className="grid gap-2">
          {users.map((user: any) => (
            <div key={user.id} className="border p-3 rounded bg-gray-50">
              <h3 className="font-semibold">{user.fullName}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

