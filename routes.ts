/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * Routes are defined WITHOUT the base path (/kvphil)
 * @type {string[]}
 */
export const publicRoutes = ["/", "/auth", "/auth/"];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to DEFAULT_LOGIN_REDIRECT
 * Routes are defined WITHOUT the base path (/kvphil)
 * @type {string[]}
 */
export const authRoutes = [`/auth/login`, `/auth/register`, `/auth/error`];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * Defined WITHOUT the base path (/kvphil)
 * @type {string}
 */
export const apiAuthPrefix = `/api/auth`;

/**
 * The default redirect paths after logging in/out
 * Paths are defined WITHOUT the base path (/kvphil)
 * The base path will be added by the middleware
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/philosopher";
export const DEFAULT_LOGOUT_REDIRECT = "/auth/login";
