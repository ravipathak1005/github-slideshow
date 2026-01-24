import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name_hi: '', name_en: '', slug: '' });
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    loadUsers();
    loadCategories();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users`, {
        headers: getAuthHeaders()
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`क्या आप इस उपयोगकर्ता की भूमिका को ${newRole} में बदलना चाहते हैं?`)) return;

    try {
      await axios.put(`${API}/users/${userId}/role?role=${newRole}`, {}, {
        headers: getAuthHeaders()
      });
      alert('भूमिका सफलतापूर्वक अपडेट की गई!');
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.detail || 'भूमिका अपडेट करने में विफल');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/categories`, newCategory, {
        headers: getAuthHeaders()
      });
      alert('श्रेणी सफलतापूर्वक जोड़ी गई!');
      setNewCategory({ name_hi: '', name_en: '', slug: '' });
      setShowAddCategory(false);
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.detail || 'श्रेणी जोड़ने में विफल');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-600',
      editor: 'bg-blue-600',
      reporter: 'bg-green-600',
      public: 'bg-gray-500'
    };

    const labels = {
      admin: 'एडमिन',
      editor: 'एडिटर',
      reporter: 'रिपोर्टर',
      public: 'पब्लिक'
    };

    return (
      <span className={`px-3 py-1 text-xs text-white rounded-full ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-gray-600 hover:text-gray-900" data-testid="home-link">
            ← होम
          </Link>
          <h1 className="text-lg font-semibold text-gray-800" data-testid="dashboard-title">एडमिन पैनल</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Users Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4" data-testid="users-title">उपयोगकर्ता प्रबंधन</h2>

          {loading ? (
            <div className="text-center py-8" data-testid="loading-indicator">लोड हो रहा है...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">नाम</th>
                    <th className="text-left py-2 px-4">ईमेल</th>
                    <th className="text-left py-2 px-4">भूमिका</th>
                    <th className="text-left py-2 px-4">कार्य</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50" data-testid="user-row">
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          data-testid="role-select"
                        >
                          <option value="public">पब्लिक</option>
                          <option value="reporter">रिपोर्टर</option>
                          <option value="editor">एडिटर</option>
                          <option value="admin">एडमिन</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" data-testid="categories-title">श्रेणियां</h2>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              data-testid="add-category-button"
            >
              + श्रेणी जोड़ें
            </button>
          </div>

          {showAddCategory && (
            <form onSubmit={handleAddCategory} className="mb-4 p-4 bg-gray-50 rounded" data-testid="add-category-form">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={newCategory.name_hi}
                  onChange={(e) => setNewCategory({ ...newCategory, name_hi: e.target.value })}
                  placeholder="हिंदी नाम"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  data-testid="category-name-hi-input"
                />
                <input
                  type="text"
                  value={newCategory.name_en}
                  onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
                  placeholder="English Name"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  data-testid="category-name-en-input"
                />
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  placeholder="slug-name"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  data-testid="category-slug-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  data-testid="save-category-button"
                >
                  सहेजें
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                  data-testid="cancel-category-button"
                >
                  रद्द करें
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-3" data-testid="category-item">
                <h3 className="font-semibold">{category.name_hi}</h3>
                <p className="text-sm text-gray-600">{category.name_en}</p>
                <p className="text-xs text-gray-500 mt-1">{category.slug}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
