import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Composants
import Home from './components/Home';
import CardList from './components/CardList';
import CardDetail from './components/CardDetail';
import Calendar from './components/Calendar';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Contexte d'authentification
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cards" element={<CardList />} />
              <Route path="/cards/:id" element={<CardDetail />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <footer className="footer">
            <div className="footer-content">
              <p>© 2023 Loup-Garous de Thiercelieux - Catalogue</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
