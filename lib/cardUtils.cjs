/**
 * Card Utilities Module
 * Common functions for working with cards across the application
 */

/**
 * Validates a card object to ensure it has all required fields
 * @param {Object} card - The card object to validate
 * @returns {Object} Object containing validation result and error message if any
 */
function validateCard(card) {
    const requiredFields = ['name', 'team', 'description'];
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!card[field] || card[field].trim() === '') {
            missingFields.push(field);
        }
    });

    if (missingFields.length > 0) {
        return {
            valid: false,
            error: `Les champs suivants sont requis: ${missingFields.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Checks for any gaps or inconsistencies in card IDs
 * @param {Array} cards - Array of card objects
 * @returns {Object} Object with validation info (hasGaps, hasDuplicates, minId, maxId)
 */
function checkCardIdIntegrity(cards) {
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
        return {
            hasGaps: false,
            hasDuplicates: false,
            minId: null,
            maxId: null,
            message: 'No cards to check'
        };
    }

    // Sort cards by ID
    const sortedCards = [...cards].sort((a, b) => a.id - b.id);
    const minId = sortedCards[0].id;
    const maxId = sortedCards[sortedCards.length - 1].id;

    // Check for gaps
    let hasGaps = false;
    for (let i = 1; i < sortedCards.length; i++) {
        if (sortedCards[i].id !== sortedCards[i - 1].id + 1) {
            hasGaps = true;
            break;
        }
    }

    // Check for duplicates
    const uniqueIds = new Set(sortedCards.map(card => card.id));
    const hasDuplicates = uniqueIds.size !== sortedCards.length;

    let message = 'Card ID integrity check: ';
    message += hasGaps ? 'Found gaps in ID sequence. ' : 'No gaps in ID sequence. ';
    message += hasDuplicates ? 'Found duplicate IDs.' : 'No duplicate IDs.';

    return {
        hasGaps,
        hasDuplicates,
        minId,
        maxId,
        message
    };
}

/**
 * Prepares a card object for database insertion or update by
 * converting boolean values to integers for SQLite compatibility
 * @param {Object} card - Card object with possibly boolean values
 * @returns {Object} Card object with values converted for SQLite
 */
function prepareCardForDb(card) {
    const preparedCard = { ...card };

    // Convert booleans to integers for SQLite
    if ('is_custom' in preparedCard) {
        preparedCard.is_custom = preparedCard.is_custom ? 1 : 0;
    }

    if ('wakes_up_at_night' in preparedCard) {
        preparedCard.wakes_up_at_night = preparedCard.wakes_up_at_night ? 1 : 0;
    }

    if ('wakes_up_every_night' in preparedCard) {
        preparedCard.wakes_up_every_night = preparedCard.wakes_up_every_night ? 1 : 0;
    }

    return preparedCard;
}

/**
 * Prepares a card from the database for API response by
 * converting integer values to booleans for better JSON representation
 * @param {Object} card - Card object from the database
 * @returns {Object} Card object with values converted for API response
 */
function prepareCardForApi(card) {
    const preparedCard = { ...card };

    // Convert integers to booleans for API
    if ('is_custom' in preparedCard) {
        preparedCard.is_custom = preparedCard.is_custom === 1;
    }

    if ('wakes_up_at_night' in preparedCard) {
        preparedCard.wakes_up_at_night = preparedCard.wakes_up_at_night === 1;
    }

    if ('wakes_up_every_night' in preparedCard) {
        preparedCard.wakes_up_every_night = preparedCard.wakes_up_every_night === 1;
    }

    return preparedCard;
}

/**
 * Gets the image URL for a card, handling defaults and path formatting
 * @param {Object} card - Card object
 * @returns {string} Formatted image URL for the card
 */
function getCardImageUrl(card) {
    if (!card.image_url || card.image_url.trim() === '') {
        return '/images/defaut.png'; // Default image
    }

    // Add /images/ prefix if not already there
    if (!card.image_url.startsWith('/images/') && !card.image_url.startsWith('http')) {
        return `/images/${card.image_url}`;
    }

    return card.image_url;
}

// Export all utilities
module.exports = {
    validateCard,
    checkCardIdIntegrity,
    prepareCardForDb,
    prepareCardForApi,
    getCardImageUrl
};
