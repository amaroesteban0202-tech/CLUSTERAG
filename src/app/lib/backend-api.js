const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

const isLocalWebOrigin = () => typeof window !== 'undefined'
    && ['http:', 'https:'].includes(window.location.protocol)
    && LOCAL_HOSTNAMES.has(window.location.hostname);

const resolveApiBaseUrl = () => {
    const configuredBaseUrl = String(window.__cluster_api_base_url || '').replace(/\/+$/, '');
    if (isLocalWebOrigin() && configuredBaseUrl === 'https://clusterag.vercel.app') return '';
    return configuredBaseUrl;
};

export const buildApiUrl = (path) => `${resolveApiBaseUrl()}${path}`;

export const apiFetch = async (path, options = {}) => {
    const response = await fetch(buildApiUrl(path), {
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    const hasJson = response.headers.get('content-type')?.includes('application/json');
    const payload = hasJson ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(payload?.error?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.code = payload?.error?.code || '';
        throw error;
    }

    return payload;
};

export const getApiOrigin = () => {
    const base = resolveApiBaseUrl();
    if (!base) return window.location.origin;
    return new URL(base, window.location.origin).origin;
};
