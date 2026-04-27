export const parseNmap = (output) => {
    if (!output) return [];
    const ports = [];
    const regex = /^\s*(\d+\/(?:tcp|udp))\s+(open)\s+([^\s]+)/gm;
    let match;
    while ((match = regex.exec(output)) !== null) {
        ports.push({ port: match[1], state: match[2], service: match[3] });
    }
    return ports;
};

export const parseSherlock = (output) => {
    if (!output) return [];
    const accounts = [];
    const regex = /\[\+\]\s+([^:]+):\s+(https?:\/\/[^\s]+)/g;
    let match;
    while ((match = regex.exec(output)) !== null) {
        accounts.push({ platform: match[1].trim(), url: match[2].trim() });
    }
    return accounts;
};

export const parseSublist3r = (output) => {
    if (!output) return [];
    const cleanOutput = output.replace(/\x1B\[\d+;?\d*m/g, '').replace(/\[\d+m/g, '');
    const subdomains = [];
    const regex = /([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match;
    while ((match = regex.exec(cleanOutput)) !== null) {
        const domain = match[0];
        if (!domain.includes('Subpool') && !domain.includes('Error') && !domain.includes('Searching') && !domain.includes('Total') && !domain.includes('Enumeration') && !domain.includes('example.com')) {
            subdomains.push(domain);
        }
    }
    return [...new Set(subdomains)];
};

export const parseTechNmap = (output) => {
    if (!output) return [];
    const techs = [];
    const pushTech = (name, val) => {
        if (val) techs.push({ name, version: val.trim() });
    };

    const serverMatch = output.match(/(?:[|_]\s*)?http-server-header:\s*(.+)/);
    if (serverMatch) pushTech('Server', serverMatch[1]);

    const titleMatch = output.match(/(?:[|_]\s*)?http-title:\s*(.+)/);
    if (titleMatch) pushTech('Title', titleMatch[1]);

    const methodMatch = output.match(/(?:[|_]\s*)?http-methods:\s*(.+)/);
    if (methodMatch) pushTech('Methods', methodMatch[1]);

    const genMatch = output.match(/(?:[|_]\s*)?http-generator:\s*(.+)/);
    if (genMatch) pushTech('Generator', genMatch[1]);

    return techs;
};

export const parseNuclei = (output) => {
    if (!output) return [];

    // Try parsing as JSONL
    try {
        const lines = output.split('\n');
        const vulns = [];
        lines.forEach(line => {
            if (!line.trim()) return;
            try {
                const data = JSON.parse(line);
                if (data.template || data['template-id']) {
                    vulns.push({
                        id: data['template-id'] || data.template,
                        name: data.info?.name,
                        severity: data.info?.severity || 'info',
                        url: data['matched-at'] || data.host,
                        type: data.type
                    });
                }
            } catch (e) { /* ignore */ }
        });
        if (vulns.length > 0) return vulns;
    } catch (e) { /* ignore */ }

    // Fallback: Legacy Regex
    const vulns = [];
    const regex = /\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)/g;
    let match;
    while ((match = regex.exec(output)) !== null) {
        vulns.push({
            id: match[1],
            protocol: match[2],
            severity: match[3],
            url: match[4]
        });
    }
    return vulns;
};
