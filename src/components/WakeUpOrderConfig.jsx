import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const WakeUpOrderConfig = () => {
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState('base');
  const [includeBaseCards, setIncludeBaseCards] = useState(true);
  const [cards, setCards] = useState([]);
  const [wakeUpOrder, setWakeUpOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch variants and cards
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch variants
        const variantsResponse = await axios.get('http://localhost:5000/api/variants');
        // Make sure variants is an array
        if (Array.isArray(variantsResponse.data)) {
          setVariants(variantsResponse.data);
        } else {
          console.error('Variants data is not an array:', variantsResponse.data);
          setVariants([]);
        }

        // Fetch cards
        const cardsResponse = await axios.get('http://localhost:5000/api/cards');
        console.log('Cards data:', cardsResponse.data);
        setCards(cardsResponse.data);

        // Set up the initial wake-up order with night cards
        if (cardsResponse.data && Array.isArray(cardsResponse.data) && cardsResponse.data.length > 0) {
          // Filter night cards directly
          const nightCards = cardsResponse.data.filter(card => card.wakes_up_at_night === 1);
          console.log('Night cards directly:', nightCards);

          if (nightCards.length > 0) {
            // Create default order
            const defaultOrder = nightCards.map((card, index) => ({
              id: card.id,
              name: card.name,
              order: index + 1,
              isVariant: false
            }));

            console.log('Setting initial wake-up order:', defaultOrder);
            setWakeUpOrder(defaultOrder);
          } else {
            console.warn('No night cards found in the initial data');
            setWakeUpOrder([]);
          }
        }

        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);



  // Update wake-up order when cards are loaded
  useEffect(() => {
    if (cards.length > 0) {
      // For base game, use all night cards
      const nightCards = cards.filter(card => card.wakes_up_at_night === 1);

      // Create default order
      const defaultOrder = nightCards.map((card, index) => ({
        id: card.id,
        name: card.name,
        order: index + 1,
        isVariant: false
      }));

      setWakeUpOrder(defaultOrder);
    }
  }, [cards]);



  // Handle variant change
  const handleVariantChange = (e) => {
    const newVariantId = e.target.value;
    setSelectedVariant(newVariantId);
    updateWakeUpOrder(newVariantId, includeBaseCards);
  };

  // Separate function to update wake-up order based on variant and includeBaseCards
  const updateWakeUpOrder = async (variantId, includeBase) => {
    try {
      setLoading(true);

      // First, try to fetch existing wake-up order from the server
      try {
        const response = await axios.get(`http://localhost:5000/api/wake-up-order/${variantId}?includeBase=${includeBase}`);
        console.log('Fetched wake-up order:', response.data);

        if (response.data && response.data.order && response.data.order.length > 0) {
          // Add isVariant property for UI display
          const savedOrder = response.data.order.map(item => ({
            ...item,
            isVariant: variantId !== 'base' && !includeBase ? true : false
          }));

          // Sort by order
          const sortedOrder = [...savedOrder].sort((a, b) => a.order - b.order);
          setWakeUpOrder(sortedOrder);
          setLoading(false);
          return; // Exit early since we found a saved order
        }
      } catch (error) {
        console.log('No saved wake-up order found, creating default order');
      }

      // If no saved order exists, create a default one
      if (variantId === 'base') {
        // For base game, use all night cards
        const nightCards = cards.filter(card => card.wakes_up_at_night === 1);

        // Create default order
        const defaultOrder = nightCards.map((card, index) => ({
          id: card.id,
          name: card.name,
          order: index + 1,
          isVariant: false
        }));

        setWakeUpOrder(defaultOrder);
      } else {
        // For variants, we need to fetch variant cards
        const variantCardsResponse = await axios.get(`http://localhost:5000/api/variant-cards?variant_id=${variantId}`);
        const variantNightCards = variantCardsResponse.data.filter(card =>
          card.wakes_up_at_night === 1 || card.wakes_up_at_night === true
        );

        let allNightCards = [];
        if (includeBase) {
          const baseNightCards = cards.filter(card => card.wakes_up_at_night === 1);
          allNightCards = [...baseNightCards, ...variantNightCards];
        } else {
          allNightCards = variantNightCards;
        }

        // Create default order
        const defaultOrder = allNightCards.map((card, index) => ({
          id: card.id,
          name: card.name,
          order: index + 1,
          isVariant: !!card.variant_id
        }));

        setWakeUpOrder(defaultOrder);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error updating wake-up order for variant:', error);
      setError('Erreur lors du chargement des cartes pour cette variante');
      setLoading(false);
    }
  };

  // Handle order change for a role
  const handleOrderChange = (id, newOrder) => {
    // Convert to number and validate
    const orderNum = parseInt(newOrder, 10);
    if (isNaN(orderNum) || orderNum < 1) return;

    // Update the order for the specific role
    const updatedOrder = wakeUpOrder.map(item => {
      if (item.id === id) {
        return { ...item, order: orderNum };
      }
      return item;
    });

    // Sort by order
    const sortedOrder = [...updatedOrder].sort((a, b) => a.order - b.order);

    setWakeUpOrder(sortedOrder);
  };

  // Save wake-up order
  const saveWakeUpOrder = async () => {
    try {
      setSaving(true);
      setError('');

      if (!Array.isArray(wakeUpOrder) || wakeUpOrder.length === 0) {
        setError('Aucun rôle à sauvegarder. Veuillez sélectionner une variante avec des rôles qui se réveillent la nuit.');
        setSaving(false);
        return;
      }

      // Simplify the data structure to only include necessary fields
      const simplifiedOrder = wakeUpOrder.map(item => ({
        id: item.id,
        name: item.name,
        order: item.order
      }));

      console.log('Saving simplified wake-up order:', {
        variant_id: selectedVariant,
        include_base: includeBaseCards,
        order: simplifiedOrder
      });

      const response = await axios.post('http://localhost:5000/api/wake-up-order', {
        variant_id: selectedVariant,
        include_base: includeBaseCards,
        order: simplifiedOrder
      });

      console.log('Save response:', response.data);

      setSuccess('Ordre de réveil sauvegardé avec succès');
      setSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError('Erreur lors de la sauvegarde de l\'ordre de réveil');
      setSaving(false);
      console.error('Error saving wake-up order:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  return (
    <div className="admin-section">
      <h2>Configuration de l'ordre de réveil</h2>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-form-controls">
        <div className="admin-form-group">
          <label htmlFor="variant">Variante</label>
          <select
            id="variant"
            value={selectedVariant}
            onChange={handleVariantChange}
            disabled={loading}
          >
            <option value="base">Jeu de base</option>
            {Array.isArray(variants) && variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
        </div>

        {selectedVariant !== 'base' && (
          <div className="admin-form-group admin-checkbox-container">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={includeBaseCards}
                onChange={() => {
                  const newValue = !includeBaseCards;
                  setIncludeBaseCards(newValue);

                  // Update wake-up order based on the new includeBaseCards value
                  if (selectedVariant !== 'base') {
                    updateWakeUpOrder(selectedVariant, newValue);
                  }
                }}
                disabled={loading}
                className="admin-checkbox"
              />
              Inclure les cartes du jeu de base
            </label>
          </div>
        )}
      </div>

      <div className="admin-wake-up-order">
        <h3 className="admin-wake-up-title">Ordre de réveil des rôles</h3>
        <p className="admin-help-text">
          Entrez un numéro pour chaque rôle pour définir son ordre de réveil pendant la nuit.
          Les numéros les plus petits seront appelés en premier.
        </p>
        <p className="admin-help-text">
          Cet ordre sera utilisé par le Maître du Jeu lors de la phase de nuit.
        </p>

        {loading ? (
          <div className="admin-loading">Chargement...</div>
        ) : (
          <>
            <div className="admin-wake-up-container">
              {Array.isArray(wakeUpOrder) && wakeUpOrder.length > 0 ? (
                <div className="admin-wake-up-grid">
                  {wakeUpOrder.map((item) => (
                    <div key={item.id} className={`admin-wake-up-card ${item.isVariant ? 'variant' : ''}`}>
                      <div className="admin-wake-up-order-input">
                        <input
                          type="number"
                          min="1"
                          value={item.order}
                          onChange={(e) => handleOrderChange(item.id, e.target.value)}
                          className="admin-order-input"
                        />
                      </div>
                      <div className="admin-wake-up-name">{item.name}</div>
                      {item.isVariant && (
                        <div className="admin-wake-up-variant-badge">Variante</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-wake-up-empty">
                  Aucun rôle à afficher. Veuillez sélectionner une variante avec des rôles qui se réveillent la nuit.
                </div>
              )}
            </div>

            <div className="admin-actions">
              <button
                className="admin-btn admin-btn-primary"
                onClick={saveWakeUpOrder}
                disabled={saving}
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder l\'ordre'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WakeUpOrderConfig;
