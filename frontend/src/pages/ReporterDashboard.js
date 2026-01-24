import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReporterDashboard = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, getAuthHeaders } = useAuth();

  useEffect(() => {
    loadMyArticles();
  }, []);

  const loadMyArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/my-articles`, {
        headers: getAuthHeaders()
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (articleId) => {
    if (!window.confirm('क्या आप इस लेख को समीक्षा के लिए जमा करना चाहते हैं?')) return;

    try {
      await axios.post(`${API}/articles/${articleId}/submit`, {}, {
        headers: getAuthHeaders()
      });
      alert('लेख समीक्षा के लिए जमा किया गया!');
      loadMyArticles();
    } catch (error) {
      alert(error.response?.data?.detail || 'सबमिट करने में विफल');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-500',
      submitted: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      approved: 'bg-green-500',
      published: 'bg-green-700',
      rejected: 'bg-red-500'
    };

    const labels = {
      draft: 'ड्राफ्ट',
      submitted: 'जमा किया गया',
      under_review: 'समीक्षाधीन',
      approved: 'स्वीकृत',
      published: 'प्रकाशित',
      rejected: 'अस्वीकृत'
    };

    return (
      <span className={`px-3 py-1 text-xs text-white rounded-full ${badges[status]}`}>
        {labels[status]}
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
          <h1 className="text-lg font-semibold text-gray-800" data-testid="dashboard-title">रिपोर्टर डैशबोर्ड</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            to="/article/create"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            data-testid="create-article-button"
          >
            + नया लेख बनाएं
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold mb-4" data-testid="my-articles-title">मेरे लेख</h2>

          {loading ? (
            <div className="text-center py-8" data-testid="loading-indicator">लोड हो रहा है...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-gray-600" data-testid="no-articles">
              अभी तक कोई लेख नहीं है
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="border rounded-lg p-4" data-testid="article-item">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(article.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {(article.status === 'draft' || article.status === 'rejected') && (
                      <>
                        <Link
                          to={`/article/edit/${article.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                          data-testid="edit-button"
                        >
                          संपादित करें
                        </Link>
                        <button
                          onClick={() => handleSubmit(article.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          data-testid="submit-button"
                        >
                          समीक्षा के लिए जमा करें
                        </button>
                      </>
                    )}
                    {article.status === 'published' && (
                      <Link
                        to={`/article/${article.slug}`}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        data-testid="view-published-button"
                      >
                        प्रकाशित लेख देखें
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporterDashboard;
