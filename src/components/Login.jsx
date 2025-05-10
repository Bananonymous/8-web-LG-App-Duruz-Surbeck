import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const user = await login(username, password);
      
      if (user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Connexion Administrateur</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            id="username"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
      
      <div className="login-info">
        <p>
          Cette page est réservée aux administrateurs du site.
          Si vous êtes un visiteur, vous pouvez consulter les cartes et le calendrier sans vous connecter.
        </p>
      </div>
    </div>
  );
};

export default Login;
