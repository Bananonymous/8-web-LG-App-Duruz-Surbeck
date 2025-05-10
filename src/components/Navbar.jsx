import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Loups-Garous de Thiercelieux
        </Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Accueil</Link>
          <Link to="/cards" className={isActive('/cards')}>Cartes</Link>
          <Link to="/calendar" className={isActive('/calendar')}>Calendrier</Link>
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
