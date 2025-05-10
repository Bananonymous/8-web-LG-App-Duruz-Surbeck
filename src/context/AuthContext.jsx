import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté (token dans localStorage)
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setError('');
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });
      
      const { token, user } = response.data;
      
      // Stocker le token et les informations utilisateur
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Définir l'en-tête d'autorisation pour les futures requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la connexion');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
