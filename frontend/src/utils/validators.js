/**
 * Utility functions for validating user input
 */

export const isValidURL = (string) => {
    try {
        const url = new URL(string.startsWith('http') ? string : `http://${string}`);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

export const isValidIP = (string) => {
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 validation (simplified)
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

    return ipv4Regex.test(string) || ipv6Regex.test(string);
};

export const isValidDomain = (string) => {
    // Remove protocol if present
    const domain = string.replace(/^https?:\/\//, '').split('/')[0];

    // Domain regex pattern
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

    return domainRegex.test(domain);
};

export const isValidUsername = (string) => {
    // Username validation: alphanumeric, underscore, hyphen, 3-30 chars
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(string);
};

export const validateTarget = (target) => {
    if (!target || target.trim() === '') {
        return { valid: false, message: 'Target cannot be empty' };
    }

    const trimmed = target.trim();

    if (isValidIP(trimmed)) {
        return { valid: true, type: 'ip', message: 'Valid IP address' };
    }

    if (isValidDomain(trimmed) || isValidURL(trimmed)) {
        return { valid: true, type: 'domain', message: 'Valid domain/URL' };
    }

    if (isValidUsername(trimmed)) {
        return { valid: true, type: 'username', message: 'Valid username' };
    }

    return {
        valid: false,
        message: 'Invalid target. Please enter a valid domain, IP address, or username.'
    };
};
