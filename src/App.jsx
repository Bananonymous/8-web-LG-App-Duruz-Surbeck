import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components organized by feature
import { Home, Navbar } from './components/Layout';
import { CardList, CardDetail } from './components/Cards';
import { ModernCalendar } from './components/Calendar';
import { Login, ProtectedRoute } from './components/Auth';
import { AdminPanel } from './components/Admin';
import { VariantList, VariantLore, VariantCardDetail } from './components/Variants';
import { MJPage } from './components/Game';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cards" element={<CardList />} />
                <Route path="/cards/:id" element={<CardDetail />} />
                <Route path="/calendar" element={<ModernCalendar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/variants/:id" element={<VariantList />} />
                <Route path="/variants/:id/lore" element={<VariantLore />} />
                <Route path="/variant-cards/:id" element={<VariantCardDetail />} />
                <Route path="/mj" element={<MJPage />} />
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
                <p>© 2025 Les idiots du village - Fait avec beaucoup d'amour </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
