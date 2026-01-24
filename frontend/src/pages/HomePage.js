import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    loadArticles();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const params = selectedCategory ? `?category_id=${selectedCategory}` : '';
      const response = await axios.get(`${API}/articles${params}`);
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name_hi : '';
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="sticky top-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-600 hover:text-gray-900 text-xl"
            data-testid="menu-button"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-gray-800" data-testid="app-title">शिक्षक समाचार</h1>
          <div className="w-8"></div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="bg-white border-t">
            <div className="container mx-auto px-4 py-2">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="block py-2 text-blue-600 hover:text-blue-800"
                    onClick={() => setShowMenu(false)}
                    data-testid="login-link"
                  >
                    लॉगिन करें
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 text-blue-600 hover:text-blue-800"
                    onClick={() => setShowMenu(false)}
                    data-testid="register-link"
                  >
                    रजिस्टर करें
                  </Link>
                </>
              ) : (
                <>
                  <div className="py-2 text-gray-700">नमस्ते, {user.name}</div>
                  {(user.role === 'reporter' || user.role === 'editor' || user.role === 'admin') && (
                    <Link
                      to="/reporter"
                      className="block py-2 text-blue-600 hover:text-blue-800"
                      onClick={() => setShowMenu(false)}
                      data-testid="reporter-dashboard-link"
                    >
                      रिपोर्टर डैशबोर्ड
                    </Link>
                  )}
                  {(user.role === 'editor' || user.role === 'admin') && (
                    <Link
                      to="/editor"
                      className="block py-2 text-blue-600 hover:text-blue-800"
                      onClick={() => setShowMenu(false)}
                      data-testid="editor-dashboard-link"
                    >
                      एडिटर डैशबोर्ड
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block py-2 text-blue-600 hover:text-blue-800"
                      onClick={() => setShowMenu(false)}
                      data-testid="admin-dashboard-link"
                    >
                      एडमिन पैनल
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block py-2 text-red-600 hover:text-red-800 w-full text-left"
                    data-testid="logout-button"
                  >
                    लॉगआउट
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-14 z-40">
        <div className="container mx-auto px-4 py-2 flex overflow-x-auto gap-2" data-testid="category-tabs">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="category-all"
          >
            सभी समाचार
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid={`category-${category.slug}`}
            >
              {category.name_hi}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12" data-testid="loading-indicator">लोड हो रहा है...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-600" data-testid="no-articles">कोई समाचार उपलब्ध नहीं है</div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow-sm p-4" data-testid="article-card">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded-full mb-2">
                  {getCategoryName(article.category_id)}
                </span>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{article.title}</h2>
                <p className="text-sm text-gray-600 mb-3 flex items-center">
                  🕒 {formatDate(article.published_at)}
                </p>
                <Link
                  to={`/article/${article.slug}`}
                  className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
                  data-testid="read-more-button"
                >
                  पूरा पढ़ें
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
