import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditArticle = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sources, setSources] = useState([{ source_type: 'url', source_url: '', description: '' }]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    loadArticle();
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/my-articles`, {
        headers: getAuthHeaders()
      });
      const article = response.data.find(a => a.id === id);
      
      if (!article) {
        alert('लेख नहीं मिला');
        navigate('/reporter');
        return;
      }

      setTitle(article.title);
      setContent(article.content);
      setCategoryId(article.category_id);
      setSources(article.sources.length > 0 ? article.sources : [{ source_type: 'url', source_url: '', description: '' }]);
    } catch (error) {
      console.error('Failed to load article:', error);
      alert('लेख लोड करने में विफल');
      navigate('/reporter');
    } finally {
      setLoading(false);
    }
  };

  const addSource = () => {
    setSources([...sources, { source_type: 'url', source_url: '', description: '' }]);
  };

  const removeSource = (index) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const updateSource = (index, field, value) => {
    const newSources = [...sources];
    newSources[index][field] = value;
    setSources(newSources);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (sources.length === 0 || !sources[0].source_url) {
      setError('कृपया कम से कम एक स्रोत जोड़ें');
      return;
    }

    setSaving(true);

    try {
      const validSources = sources.filter(s => s.source_url);
      await axios.put(`${API}/articles/${id}`, {
        title,
        content,
        category_id: categoryId,
        sources: validSources
      }, {
        headers: getAuthHeaders()
      });

      alert('लेख सफलतापूर्वक अपडेट किया गया!');
      navigate('/reporter');
    } catch (error) {
      setError(error.response?.data?.detail || 'लेख अपडेट करने में विफल');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="loading-indicator">लोड हो रहा है...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/reporter" className="text-gray-600 hover:text-gray-900" data-testid="back-link">
            ← वापस
          </Link>
          <h1 className="text-lg font-semibold text-gray-800" data-testid="page-title">लेख संपादित करें</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm" data-testid="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">शीर्षक</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                data-testid="title-input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">श्रेणी</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                data-testid="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_hi}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">सामग्री</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="10"
                required
                data-testid="content-textarea"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">स्रोत (कम से कम 1 आवश्यक)</label>
              {sources.map((source, index) => (
                <div key={index} className="mb-3 p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">स्रोत {index + 1}</span>
                    {sources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSource(index)}
                        className="text-red-600 text-sm"
                        data-testid={`remove-source-${index}`}
                      >
                        हटाएं
                      </button>
                    )}
                  </div>

                  <input
                    type="url"
                    value={source.source_url}
                    onChange={(e) => updateSource(index, 'source_url', e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={index === 0}
                    data-testid={`source-url-${index}`}
                  />

                  <input
                    type="text"
                    value={source.description}
                    onChange={(e) => updateSource(index, 'description', e.target.value)}
                    placeholder="स्रोत का विवरण (वैकल्पिक)"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid={`source-description-${index}`}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addSource}
                className="text-blue-600 hover:text-blue-800 text-sm"
                data-testid="add-source-button"
              >
                + अधिक स्रोत जोड़ें
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                data-testid="save-button"
              >
                {saving ? 'सहेजा जा रहा है...' : 'परिवर्तन सहेजें'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;
