import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditorDashboard = () => {
  const [reviewQueue, setReviewQueue] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    loadReviewQueue();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/review-queue`, {
        headers: getAuthHeaders()
      });
      setReviewQueue(response.data);
    } catch (error) {
      console.error('Failed to load review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name_hi : '';
  };

  const handleApprove = async (articleId) => {
    if (!window.confirm('क्या आप इस लेख को स्वीकृत करना चाहते हैं?')) return;

    try {
      await axios.post(`${API}/articles/${articleId}/approve`, { comment }, {
        headers: getAuthHeaders()
      });
      alert('लेख स्वीकृत किया गया!');
      setSelectedArticle(null);
      setComment('');
      loadReviewQueue();
    } catch (error) {
      alert(error.response?.data?.detail || 'अनुमोदन में विफल');
    }
  };

  const handleReject = async (articleId) => {
    if (!comment) {
      alert('कृपया अस्वीकृति का कारण बताएं');
      return;
    }

    if (!window.confirm('क्या आप इस लेख को अस्वीकृत करना चाहते हैं?')) return;

    try {
      await axios.post(`${API}/articles/${articleId}/reject`, { comment }, {
        headers: getAuthHeaders()
      });
      alert('लेख अस्वीकृत किया गया');
      setSelectedArticle(null);
      setComment('');
      loadReviewQueue();
    } catch (error) {
      alert(error.response?.data?.detail || 'अस्वीकृति में विफल');
    }
  };

  const handlePublish = async (articleId) => {
    if (!window.confirm('क्या आप इस लेख को प्रकाशित करना चाहते हैं?')) return;

    try {
      await axios.post(`${API}/articles/${articleId}/publish`, {}, {
        headers: getAuthHeaders()
      });
      alert('लेख प्रकाशित किया गया!');
      loadReviewQueue();
    } catch (error) {
      alert(error.response?.data?.detail || 'प्रकाशन में विफल');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-gray-600 hover:text-gray-900" data-testid="home-link">
            ← होम
          </Link>
          <h1 className="text-lg font-semibold text-gray-800" data-testid="dashboard-title">एडिटर डैशबोर्ड</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold mb-4" data-testid="review-queue-title">समीक्षा कतार</h2>

          {loading ? (
            <div className="text-center py-8" data-testid="loading-indicator">लोड हो रहा है...</div>
          ) : reviewQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-600" data-testid="no-articles">
              समीक्षा के लिए कोई लेख नहीं
            </div>
          ) : (
            <div className="space-y-4">
              {reviewQueue.map((article) => (
                <div key={article.id} className="border rounded-lg p-4" data-testid="article-item">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded-full mb-2">
                      {getCategoryName(article.category_id)}
                    </span>
                    <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-600">लेखक: {article.author_name}</p>
                  </div>

                  {selectedArticle === article.id ? (
                    <div className="bg-gray-50 p-4 rounded mb-3">
                      <div className="mb-3">
                        <h4 className="font-semibold mb-2">सामग्री:</h4>
                        <div className="text-sm bg-white p-3 rounded border max-h-40 overflow-y-auto">
                          {article.content}
                        </div>
                      </div>

                      {article.sources && article.sources.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-semibold mb-2">स्रोत:</h4>
                          <div className="space-y-2">
                            {article.sources.map((source, index) => (
                              <div key={index} className="text-sm bg-white p-2 rounded border">
                                <a
                                  href={source.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                >
                                  {source.source_url}
                                </a>
                                {source.description && (
                                  <p className="text-gray-600 mt-1">{source.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="block text-sm font-semibold mb-2">टिप्पणी (वैकल्पिक)</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="अपनी फीडबैक यां यहां जोड़ें..."
                          data-testid="comment-textarea"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(article.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          data-testid="approve-button"
                        >
                          ✓ स्वीकृत करें
                        </button>
                        <button
                          onClick={() => handleReject(article.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          data-testid="reject-button"
                        >
                          ✕ अस्वीकृत करें
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(null);
                            setComment('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                          data-testid="cancel-button"
                        >
                          रद्द करें
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedArticle(article.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      data-testid="review-button"
                    >
                      समीक्षा करें
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Articles Section */}
        <ApprovedArticles getAuthHeaders={getAuthHeaders} handlePublish={handlePublish} categories={categories} />
      </div>
    </div>
  );
};

const ApprovedArticles = ({ getAuthHeaders, handlePublish, categories }) => {
  const [approvedArticles, setApprovedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovedArticles();
  }, []);

  const loadApprovedArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/my-articles`, {
        headers: getAuthHeaders()
      });
      const approved = response.data.filter(a => a.status === 'approved');
      setApprovedArticles(approved);
    } catch (error) {
      console.error('Failed to load approved articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name_hi : '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
      <h2 className="text-xl font-semibold mb-4" data-testid="approved-articles-title">स्वीकृत लेख (प्रकाशन के लिए तैयार)</h2>

      {loading ? (
        <div className="text-center py-8">लोड हो रहा है...</div>
      ) : approvedArticles.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          कोई स्वीकृत लेख नहीं
        </div>
      ) : (
        <div className="space-y-4">
          {approvedArticles.map((article) => (
            <div key={article.id} className="border rounded-lg p-4" data-testid="approved-article-item">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded-full mb-2">
                {getCategoryName(article.category_id)}
              </span>
              <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
              <p className="text-sm text-gray-600 mb-3">लेखक: {article.author_name}</p>

              <button
                onClick={() => handlePublish(article.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                data-testid="publish-button"
              >
                📰 प्रकाशित करें
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;
