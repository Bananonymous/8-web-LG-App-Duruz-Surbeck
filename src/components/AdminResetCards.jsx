import { useState } from 'react';
import axios from 'axios';
import './MJPage.css';

const AdminResetCards = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetCards = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser toutes les cartes ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté en tant qu\'administrateur pour effectuer cette action.');
        setLoading(false);
        return;
      }

      // First verify the token is still valid
      try {
        await axios.get('http://localhost:5000/api/verify-token', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (tokenError) {
        // Token is invalid, show error and prompt to login again
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // Token is valid, proceed with the reset
      const response = await axios.post(
        'http://localhost:5000/api/reset-cards',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(`${response.data.message} (${response.data.count} cartes ajoutées)`);
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('Error resetting cards:', error);
      if (error.response?.status === 403) {
        setError('Accès refusé. Vous devez être administrateur pour effectuer cette action.');
      } else {
        setError(error.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation des cartes.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="mj-card">
      <h2>Réinitialiser les cartes</h2>
      <p>
        Cette action supprimera toutes les cartes existantes et les remplacera par les cartes par défaut.
        Utilisez cette fonction si certaines cartes sont manquantes ou si vous souhaitez revenir à l'état initial.
      </p>

      {error && <div className="mj-error">{error}</div>}
      {message && <div className={`mj-message ${success ? 'mj-success' : ''}`}>{message}</div>}

      <div className="mj-actions">
        <button
          className="mj-btn mj-btn-danger"
          onClick={handleResetCards}
          disabled={loading}
        >
          {loading ? 'Réinitialisation en cours...' : 'Réinitialiser toutes les cartes'}
        </button>
      </div>
    </div>
  );
};

export default AdminResetCards;
