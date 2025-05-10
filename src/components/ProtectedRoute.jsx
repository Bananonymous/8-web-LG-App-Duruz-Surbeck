import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser || !currentUser.is_admin) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    // ou n'est pas un administrateur
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
