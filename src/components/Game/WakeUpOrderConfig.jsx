import { useState, useEffect } from 'react';
import axios from 'axios';
import '../Admin/AdminPanel.css';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  const [isDragMode, setIsDragMode] = useState(true); // Default to drag mode
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  // Function to format API error messages
  const formatErrorMessage = (error) => {
    if (!error) return 'Une erreur inconnue est survenue';

    // API returned error details
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        return `Erreur: ${error.response.data.message}`;
      }
    }

    // Network errors
    if (error.message === 'Network Error') {
      return 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et que le serveur est démarré.';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'La requête a pris trop de temps. Veuillez réessayer.';
    }

    // Default error message
    return `Erreur: ${error.message || 'Une erreur est survenue'}`;
  };

  // Fetch variants and cards with improved error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Create a cancelable request
        const source = axios.CancelToken.source();
        const timeout = setTimeout(() => {
          source.cancel('Request timeout');
          setError('La requête a pris trop de temps. Veuillez rafraîchir la page.');
          setLoading(false);
        }, 10000); // 10 second timeout

        // Fetch variants
        try {
          const variantsResponse = await axios.get(`${API_BASE_URL}/variants`, {
            cancelToken: source.token
          });

          if (Array.isArray(variantsResponse.data)) {
            setVariants(variantsResponse.data);
          } else {
            console.error('Variants data is not an array:', variantsResponse.data);
            setVariants([]);
            setError('Format de données incorrect pour les variantes');
          }
        } catch (variantError) {
          console.error('Error fetching variants:', variantError);
          // Continue despite variant error
          setVariants([]);
          setError('Impossible de charger les variantes. ' + formatErrorMessage(variantError));
        }

        // Fetch cards even if variants failed
        try {
          const cardsResponse = await axios.get(`${API_BASE_URL}/cards`, {
            cancelToken: source.token
          });

          if (Array.isArray(cardsResponse.data)) {
            setCards(cardsResponse.data);

            // Set up the initial wake-up order with night cards
            // Check for both numeric 1 and boolean true values for wakes_up_at_night
            const nightCards = cardsResponse.data.filter(card =>
              card.wakes_up_at_night === 1 ||
              card.wakes_up_at_night === true ||
              card.wakes_up_at_night === "1"
            );

            if (nightCards.length > 0) {
              const defaultOrder = nightCards.map((card, index) => ({
                id: card.id,
                name: card.name,
                order: index + 1,
                isVariant: false
              }));

              setWakeUpOrder(defaultOrder);
            } else {
              console.warn('No night cards found in the initial data');
              setWakeUpOrder([]);
            }
          } else {
            console.error('Cards data is not an array:', cardsResponse.data);
            setError(prev => prev ? prev + ' Format de données incorrect pour les cartes.' : 'Format de données incorrect pour les cartes.');
          }
        } catch (cardError) {
          console.error('Error fetching cards:', cardError);
          setError(prev => prev ? prev + ' Impossible de charger les cartes.' : 'Impossible de charger les cartes. ' + formatErrorMessage(cardError));
        }

        clearTimeout(timeout);
        setLoading(false);
      } catch (error) {
        setError('Erreur lors du chargement des données: ' + formatErrorMessage(error));
        setLoading(false);
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Update wake-up order when cards are loaded
  useEffect(() => {
    if (cards.length > 0) {
      // For base game, use all night cards - check for all possible true values
      const nightCards = cards.filter(card =>
        card.wakes_up_at_night === 1 ||
        card.wakes_up_at_night === true ||
        card.wakes_up_at_night === "1"
      );

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
        const response = await axios.get(`${API_BASE_URL}/wake-up-order/${variantId}?includeBase=${includeBase}`);

        // Check for both possible response formats: order or order_data
        const orderData = response.data.order_data || response.data.order;

        if (response.data && orderData && orderData.length > 0) {
          // Add isVariant property for UI display
          const savedOrder = orderData.map(item => ({
            ...item,
            isVariant: variantId !== 'base' && !includeBase ? true : false
          }));

          // Sort by order
          const sortedOrder = [...savedOrder].sort((a, b) => a.order - b.order);
          setWakeUpOrder(sortedOrder);
          setLoading(false);
          return; // Exit early since we found a saved order
        }
      } catch (fetchError) {
        // If no saved order exists, create a default one
      }

      // If no saved order exists, create a default one
      if (variantId === 'base') {
        // For base game, use all night cards - check for all possible true values
        const nightCards = cards.filter(card =>
          card.wakes_up_at_night === 1 ||
          card.wakes_up_at_night === true ||
          card.wakes_up_at_night === "1"
        );

        console.log('Base game night cards:', nightCards.map(c => ({ id: c.id, name: c.name, wakes_up_at_night: c.wakes_up_at_night })));

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
        const variantCardsResponse = await axios.get(`${API_BASE_URL}/variant-cards?variant_id=${variantId}`);
        const variantNightCards = variantCardsResponse.data.filter(card =>
          card.wakes_up_at_night === 1 ||
          card.wakes_up_at_night === true ||
          card.wakes_up_at_night === "1"
        );

        console.log('Variant night cards:', variantNightCards.map(c => ({ id: c.id, name: c.name, wakes_up_at_night: c.wakes_up_at_night })));

        let allNightCards = [];
        if (includeBase) {
          const baseNightCards = cards.filter(card =>
            card.wakes_up_at_night === 1 ||
            card.wakes_up_at_night === true ||
            card.wakes_up_at_night === "1"
          );
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

  // Toggle between drag mode and manual input mode
  const toggleDragMode = () => {
    setIsDragMode(!isDragMode);
  };

  // Handle drag start
  const handleDragStart = (e, item, index) => {
    console.log('Drag start:', item.name, index);
    setDraggedItem(item);
    // Set data for drag operation
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Add a class to the dragged element
    e.target.classList.add('dragging');
  };

  // Handle drag over
  const handleDragOver = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Only update if we're dragging over a different item
    if (!draggedOverItem || draggedOverItem.id !== item.id) {
      setDraggedOverItem(item);
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    console.log('Drag end');
    e.target.classList.remove('dragging');
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // Handle drop
  const handleDrop = (e, targetItem, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) {
      console.log('No dragged item found');
      return;
    }

    console.log('Drop:', draggedItem.name, 'onto', targetItem.name);

    try {
      // Find the source index
      const sourceIndex = wakeUpOrder.findIndex(item => item.id === draggedItem.id);

      if (sourceIndex === -1) {
        console.error('Source item not found in the list');
        return;
      }

      // If dropped on itself, do nothing
      if (sourceIndex === targetIndex) {
        console.log('Dropped on self, no change');
        return;
      }

      // Create a copy of the current wake-up order
      const newOrder = [...wakeUpOrder];

      // Remove the dragged item from the array
      const [movedItem] = newOrder.splice(sourceIndex, 1);

      // Insert the dragged item at the new position
      newOrder.splice(targetIndex, 0, movedItem);

      // Update the order numbers based on the new positions
      const updatedOrder = newOrder.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      console.log('Updated order after drop:', updatedOrder);

      // Update the state with the new order
      setWakeUpOrder(updatedOrder);
    } catch (error) {
      console.error('Error during drop operation:', error);
    } finally {
      // Reset drag state
      setDraggedItem(null);
      setDraggedOverItem(null);
    }
  };

  // Handle moving an item up in the list
  const handleMoveUp = (index) => {
    if (index === 0) return; // Already at the top

    const newOrder = [...wakeUpOrder];
    // Swap the item with the one above it
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];

    // Update the order numbers
    const updatedOrder = newOrder.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setWakeUpOrder(updatedOrder);
  };

  // Handle moving an item down in the list
  const handleMoveDown = (index) => {
    if (index === wakeUpOrder.length - 1) return; // Already at the bottom

    const newOrder = [...wakeUpOrder];
    // Swap the item with the one below it
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    // Update the order numbers
    const updatedOrder = newOrder.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setWakeUpOrder(updatedOrder);
  };

  // Save wake-up order with improved error handling
  const saveWakeUpOrder = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate the data before sending
      if (!Array.isArray(wakeUpOrder) || wakeUpOrder.length === 0) {
        setError('Aucun rôle à sauvegarder. Veuillez sélectionner une variante avec des rôles qui se réveillent la nuit.');
        setSaving(false);
        return;
      }

      // Validate selected variant
      if (!selectedVariant) {
        setError('Veuillez sélectionner une variante.');
        setSaving(false);
        return;
      }

      // Validate that all roles have unique order values
      const orderValues = wakeUpOrder.map(item => item.order);
      const uniqueOrderValues = new Set(orderValues);
      if (uniqueOrderValues.size !== orderValues.length) {
        setError('Chaque rôle doit avoir un ordre de réveil unique. Veuillez corriger les doublons.');
        setSaving(false);
        return;
      }

      // Simplify the data structure to only include necessary fields
      const simplifiedOrder = wakeUpOrder.map(item => ({
        id: item.id,
        name: item.name,
        order: item.order
      }));

      // Prepare the data according to the API requirements
      // The API expects variant_id and order_data fields
      const requestData = {
        variant_id: selectedVariant,
        include_base: includeBaseCards,
        order_data: simplifiedOrder // Changed from 'order' to 'order_data'
      };

      console.log('Saving wake-up order with data:', requestData);

      // Create a cancelable request
      const source = axios.CancelToken.source();
      const timeout = setTimeout(() => {
        source.cancel('Request timeout');
        setError('La sauvegarde a pris trop de temps. Veuillez réessayer.');
        setSaving(false);
      }, 10000); // 10 second timeout

      try {
        const response = await axios.post(`${API_BASE_URL}/wake-up-order`, requestData, {
          cancelToken: source.token,
          timeout: 10000 // Additional 10 second timeout as backup
        });

        console.log('Save response:', response.data);
        clearTimeout(timeout);

        setSuccess('Ordre de réveil sauvegardé avec succès');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (apiError) {
        console.error('Error from API when saving wake-up order:', apiError);

        if (apiError.response) {
          // Server responded with error
          if (apiError.response.status === 400) {
            setError(`Erreur de validation: ${apiError.response.data.message || 'Les données envoyées sont incorrectes'}`);
          } else if (apiError.response.status === 401 || apiError.response.status === 403) {
            setError('Vous n\'avez pas les droits pour effectuer cette action. Veuillez vous reconnecter.');
          } else {
            setError(`Erreur du serveur (${apiError.response.status}): ${apiError.response.data.message || 'Une erreur est survenue'}`);
          }
        } else if (apiError.request) {
          // No response received
          setError('Aucune réponse reçue du serveur. Veuillez vérifier votre connexion et réessayer.');
        } else {
          // Other error
          setError('Erreur lors de la sauvegarde: ' + formatErrorMessage(apiError));
        }
      }
    } catch (error) {
      setError('Erreur inattendue: ' + formatErrorMessage(error));
      console.error('Unexpected error saving wake-up order:', error);
    } finally {
      setSaving(false);
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

        {isDragMode ? (
          <p className="admin-help-text">
            Cliquez et glissez les cartes pour les réorganiser dans la grille.
            L'ordre est déterminé de gauche à droite, puis de haut en bas.
            Les rôles avec les numéros les plus petits seront appelés en premier pendant la nuit.
          </p>
        ) : (
          <p className="admin-help-text">
            Entrez un numéro pour chaque rôle pour définir son ordre de réveil pendant la nuit.
            Les numéros les plus petits seront appelés en premier.
          </p>
        )}

        <p className="admin-help-text">
          Cet ordre sera utilisé par le Maître du Jeu lors de la phase de nuit.
        </p>

        <div className="admin-mode-toggle">
          <div className="admin-toggle-label">Mode de configuration:</div>
          <div className="admin-toggle-buttons">
            <button
              className={`admin-btn-toggle ${isDragMode ? 'active' : ''}`}
              onClick={() => setIsDragMode(true)}
            >
              <span className="admin-toggle-icon">↕️</span> Glisser-déposer
              {isDragMode && <span className="admin-toggle-check">✓</span>}
            </button>
            <button
              className={`admin-btn-toggle ${!isDragMode ? 'active' : ''}`}
              onClick={() => setIsDragMode(false)}
            >
              <span className="admin-toggle-icon">🔢</span> Numéros manuels
              {!isDragMode && <span className="admin-toggle-check">✓</span>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Chargement...</div>
        ) : (
          <>
            <div className="admin-wake-up-container">
              {Array.isArray(wakeUpOrder) && wakeUpOrder.length > 0 ? (
                isDragMode ? (
                  <div className="admin-drag-list">
                    {wakeUpOrder.map((item, index) => (
                      <div
                        key={`item-${item.id}`}
                        className={`admin-wake-up-card-draggable ${item.isVariant ? 'variant' : ''} ${draggedItem && draggedItem.id === item.id ? 'dragging' : ''} ${draggedOverItem && draggedOverItem.id === item.id ? 'drag-over' : ''}`}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item, index)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDragEnter={(e) => e.preventDefault()}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, item, index)}
                      >
                        <div className="admin-wake-up-order-badge">{index + 1}</div>
                        <div className="admin-wake-up-name">{item.name}</div>
                        <div className="admin-drag-handle" title="Glisser pour réorganiser">
                          <span className="admin-drag-icon">↕️</span>
                          <span className="admin-drag-text">Glisser</span>
                        </div>
                        {item.isVariant && (
                          <div className="admin-wake-up-variant-badge">Variante</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
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
                )
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
