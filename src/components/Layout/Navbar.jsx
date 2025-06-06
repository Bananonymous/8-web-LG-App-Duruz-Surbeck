import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NavDropdown from './NavDropdown';
import axios from 'axios';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [variants, setVariants] = useState([]);

  // Fetch variants for the dropdown
  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/variants');
        setVariants(response.data);
      } catch (error) {
        console.error('Error fetching variants:', error);
      }
    };

    fetchVariants();
  }, []);

  // Re-fetch variants when navigating away from admin routes
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const wasAdminRoute = sessionStorage.getItem('wasInAdmin') === 'true';

    // If we were in admin and now we're not, refresh variants
    if (wasAdminRoute && !isAdminRoute) {
      const fetchVariants = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/variants');
          setVariants(response.data);
        } catch (error) {
          console.error('Error fetching variants:', error);
        }
      };
      fetchVariants();
      sessionStorage.removeItem('wasInAdmin');
    }

    // Track if we're currently in admin
    if (isAdminRoute) {
      sessionStorage.setItem('wasInAdmin', 'true');
    }
  }, [location.pathname]);

  // Format variants for the dropdown
  const variantItems = variants.map(variant => ({
    id: variant.id,
    name: variant.name,
    path: `/variants/${variant.id}`
  }));

  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Les idiots du village
        </Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Accueil</Link>
          <Link to="/cards" className={isActive('/cards')}>Cartes</Link>
          <NavDropdown title="Variantes" items={variantItems} />
          <Link to="/calendar" className={isActive('/calendar')}>Calendrier</Link>
          <Link to="/mj" className={isActive('/mj')}>MJ</Link>
          {currentUser ? (
            <>
              {currentUser.is_admin && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
              <a href="#"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
                className="navbar-logout"
              >
                Déconnexion
              </a>
            </>
          ) : (
            <Link to="/login" className={isActive('/login')}>Connexion</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
