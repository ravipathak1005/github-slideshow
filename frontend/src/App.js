import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import HomePage from '@/pages/HomePage';
import ArticlePage from '@/pages/ArticlePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ReporterDashboard from '@/pages/ReporterDashboard';
import EditorDashboard from '@/pages/EditorDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import CreateArticle from '@/pages/CreateArticle';
import EditArticle from '@/pages/EditArticle';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/reporter"
            element={
              <ProtectedRoute allowedRoles={['reporter', 'editor', 'admin']}>
                <ReporterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/article/create"
            element={
              <ProtectedRoute allowedRoles={['reporter', 'editor', 'admin']}>
                <CreateArticle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/article/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['reporter', 'editor', 'admin']}>
                <EditArticle />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/editor"
            element={
              <ProtectedRoute allowedRoles={['editor', 'admin']}>
                <EditorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
