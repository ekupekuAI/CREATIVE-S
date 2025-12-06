// API prefix configuration for event-planner frontend
// If the app is served under a subpath like /event-planner, the backend
// is mounted by the unified server under /api/event-planner. This helper
// infers the correct API prefix but also respects `window.__API_PREFIX__`
// when explicitly set by the host HTML.

const API_PREFIX = (() => {
    // Explicit override from hosting page
    if (typeof window !== 'undefined' && window.__API_PREFIX__ !== undefined) {
        return window.__API_PREFIX__ || '';
    }

    // If the frontend is served under /event-planner, assume backend is
    // mounted under /api/event-planner by the unified server.
    try {
        const path = window.location.pathname || '/';
        if (path.startsWith('/event-planner')) return '/api/event-planner';
    } catch (e) {
        // ignore
    }

    // Default: same-origin root
    return '';
})();

function api(path) {
    if (!path.startsWith('/')) path = `/${path}`;
    return `${API_PREFIX}${path}`;
}

export { API_PREFIX, api };
