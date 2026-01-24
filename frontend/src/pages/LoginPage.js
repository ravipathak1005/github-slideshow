import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'editor') navigate('/editor');
      else if (user.role === 'reporter') navigate('/reporter');
      else navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-center mb-2" data-testid="login-title">शिक्षक समाचार</h1>
          <p className="text-center text-gray-600 mb-6">लॉगिन करें</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm" data-testid="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">ईमेल</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                data-testid="email-input"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">पासवर्ड</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              data-testid="login-submit-button"
            >
              {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-blue-600 hover:text-blue-800" data-testid="register-link">
              नया अकाउंट बनाएं
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-600 hover:text-gray-800" data-testid="home-link">
              होम पेज पर जाएं
            </Link>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-semibold mb-2">डेमो अकाउंट:</p>
          <p>एडमिन: admin@newsflow.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
