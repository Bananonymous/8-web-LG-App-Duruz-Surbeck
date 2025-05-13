/**
 * Centralized Logger Module
 * Provides consistent logging functionality across the application
 */

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const debugMode = process.env.DEBUG === 'true';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m'
};

/**
 * Generate timestamp in ISO format
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Create a logger instance with optional context
 * @param {string} context - The context for this logger (e.g., 'Server', 'Database')
 * @returns {Object} Logger object with logging methods
 */
function createLogger(context = 'App') {
    return {
        /**
         * Log debug message - only shown in development or when DEBUG=true
         * @param {string} message - Message to log
         * @param {Object} [data] - Optional data to include
         */
        debug: function (message, data) {
            if (isDevelopment || debugMode) {
                const logMessage = `${colors.dim}[DEBUG][${getTimestamp()}][${context}] ${message}${colors.reset}`;
                console.debug(logMessage, data !== undefined ? data : '');
            }
        },

        /**
         * Log informational message
         * @param {string} message - Message to log
         * @param {Object} [data] - Optional data to include
         */
        info: function (message, data) {
            const logMessage = `${colors.blue}[INFO][${getTimestamp()}][${context}] ${message}${colors.reset}`;
            console.info(logMessage, data !== undefined ? data : '');
        },

        /**
         * Log success message
         * @param {string} message - Message to log
         * @param {Object} [data] - Optional data to include
         */
        success: function (message, data) {
            const logMessage = `${colors.green}[SUCCESS][${getTimestamp()}][${context}] ${message}${colors.reset}`;
            console.log(logMessage, data !== undefined ? data : '');
        },

        /**
         * Log warning message
         * @param {string} message - Message to log
         * @param {Object} [data] - Optional data to include
         */
        warn: function (message, data) {
            const logMessage = `${colors.yellow}[WARN][${getTimestamp()}][${context}] ${message}${colors.reset}`;
            console.warn(logMessage, data !== undefined ? data : '');
        },

        /**
         * Log error message
         * @param {string} message - Message to log
         * @param {Error|Object} [error] - Optional error object or data
         */
        error: function (message, error) {
            const logMessage = `${colors.red}[ERROR][${getTimestamp()}][${context}] ${message}${colors.reset}`;

            if (error instanceof Error) {
                console.error(logMessage, {
                    message: error.message,
                    stack: isDevelopment ? error.stack : undefined
                });
            } else {
                console.error(logMessage, error !== undefined ? error : '');
            }
        },

        /**
         * Log section header
         * @param {string} title - Section title
         */
        section: function (title) {
            const separator = '='.repeat(title.length + 4);
            console.log(`\n${colors.cyan}${separator}${colors.reset}`);
            console.log(`${colors.cyan}  ${title}  ${colors.reset}`);
            console.log(`${colors.cyan}${separator}${colors.reset}\n`);
        }
    };
}

// Export both the factory function and a default app logger
module.exports = {
    createLogger,
    logger: createLogger('App') // Default logger
};
