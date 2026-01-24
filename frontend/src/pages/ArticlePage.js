import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ArticlePage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/articles/${slug}`);
      setArticle(response.data);
      
      // Load category
      const catResponse = await axios.get(`${API}/categories`);
      const cat = catResponse.data.find(c => c.id === response.data.category_id);
      setCategory(cat);
    } catch (error) {
      console.error('Failed to load article:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="loading-indicator">लोड हो रहा है...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">समाचार नहीं मिला</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800">होम पेज पर जाएं</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="sticky top-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-gray-600 hover:text-gray-900 text-xl" data-testid="back-button">
            ←
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">शिक्षक समाचार</h1>
          <div className="w-8"></div>
        </div>
      </nav>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-6 max-w-3xl" data-testid="article-content">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Category Badge */}
          {category && (
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded-full mb-4">
              {category.name_hi}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-relaxed" data-testid="article-title">
            {article.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center text-sm text-gray-600 mb-6 pb-6 border-b">
            <span className="mr-4">📅 {formatDate(article.published_at)}</span>
            <span>✍️ {article.author_name}</span>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed" style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
            <div dangerouslySetInnerHTML={{ __html: article.content }} data-testid="article-body" />
          </div>

          {/* Sources */}
          {article.sources && article.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="sources-section">स्रोत:</h3>
              <div className="space-y-2">
                {article.sources.map((source, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                      data-testid={`source-link-${index}`}
                    >
                      {source.source_url}
                    </a>
                    {source.description && (
                      <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
