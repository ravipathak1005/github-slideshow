import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, name, 'reporter');
    setLoading(false);

    if (result.success) {
      navigate('/reporter');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-center mb-2" data-testid="register-title">शिक्षक समाचार</h1>
          <p className="text-center text-gray-600 mb-6">रिपोर्टर के रूप में रजिस्टर करें</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm" data-testid="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">नाम</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                data-testid="name-input"
              />
            </div>

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
                minLength="6"
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              data-testid="register-submit-button"
            >
              {loading ? 'रजिस्टर हो रहा है...' : 'रजिस्टर करें'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-800" data-testid="login-link">
              पहले से अकाउंट है? लॉगिन करें
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-600 hover:text-gray-800" data-testid="home-link">
              होम पेज पर जाएं
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
