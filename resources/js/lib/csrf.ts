/**
 * Get CSRF headers for fetch/XHR requests.
 *
 * Reads from the XSRF-TOKEN cookie (set by Laravel on every response),
 * which stays fresh across Inertia navigations (e.g. after login).
 * Falls back to the <meta> tag for the initial page load.
 */
export function getCsrfHeaders(): Record<string, string> {
    // Try XSRF-TOKEN cookie first — always updated by Laravel
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
        return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
    }

    // Fallback to meta tag
    const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    )?.content;
    if (meta) {
        return { 'X-CSRF-TOKEN': meta };
    }

    return {};
}

/**
 * Apply CSRF headers to an XMLHttpRequest.
 */
export function applyCsrfHeaders(xhr: XMLHttpRequest): void {
    const headers = getCsrfHeaders();
    for (const [name, value] of Object.entries(headers)) {
        xhr.setRequestHeader(name, value);
    }
}
