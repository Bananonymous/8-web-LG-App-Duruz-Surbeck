import { useState } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminLoginHelp = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleResetAdmin = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe administrateur ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      const response = await axios.post('http://localhost:5000/api/reset-admin');
      setMessage(response.data.message);
      setSuccess(true);
    } catch (error) {
      console.error('Error resetting admin password:', error);
      setError(error.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe administrateur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-help">
      <button 
        className="admin-login-help-toggle" 
        onClick={() => setShowHelp(!showHelp)}
      >
        {showHelp ? 'Masquer l\'aide' : 'Besoin d\'aide ?'}
      </button>
      
      {showHelp && (
        <div className="admin-login-help-content">
          <h3>Problèmes de connexion ?</h3>
          
          {error && <div className="admin-login-error">{error}</div>}
          {message && <div className={`admin-login-message ${success ? 'admin-login-success' : ''}`}>{message}</div>}
          
          <p>
            Si vous ne pouvez pas vous connecter, vous pouvez réinitialiser le mot de passe administrateur
            aux valeurs par défaut (nom d'utilisateur: <strong>admin</strong>, mot de passe: <strong>admin123</strong>).
          </p>
          
          <button
            className="admin-login-reset-btn"
            onClick={handleResetAdmin}
            disabled={loading}
          >
            {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe admin'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLoginHelp;
