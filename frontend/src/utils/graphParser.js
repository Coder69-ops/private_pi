import dagre from 'dagre';

const positionGraph = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB' }); // Top-to-Bottom layout

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 180, height: 60 }); // Estimated node size
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = 'top';
        node.sourcePosition = 'bottom';

        // Shift slightly to center
        node.position = {
            x: nodeWithPosition.x - 90,
            y: nodeWithPosition.y - 30,
        };

        return node;
    });
};

export const transformDataToGraph = (data) => {
    const nodes = [];
    const edges = [];

    // 1. Root Node (Target)
    const targetId = 'root';
    nodes.push({
        id: targetId,
        type: 'targetNode', // Custom type we'll define
        data: { label: data.target },
        position: { x: 0, y: 0 }, // Initial pos, will be calc by dagre
    });

    // Helper to track unique IDs
    const addedIds = new Set([targetId]);

    // 2. Open Ports (Nmap) - Level 1 direct from Root if no subdomains, or mixed.
    // For simplicity, we attach main ports to Root.
    if (data.nmap_data && Array.isArray(data.nmap_data.open_ports)) {
        data.nmap_data.open_ports.forEach((port, idx) => {
            const portId = `port-${port.port}`;
            if (!addedIds.has(portId)) {
                nodes.push({
                    id: portId,
                    type: 'portNode',
                    data: { label: `${port.port}/${port.service}`, port: port.port },
                    position: { x: 0, y: 0 },
                });
                edges.push({
                    id: `e-${targetId}-${portId}`,
                    source: targetId,
                    target: portId,
                    animated: true,
                    style: { stroke: '#10b981' } // Emerald edge
                });
                addedIds.add(portId);
            }
        });
    }

    // 3. Subdomains (Sublist3r) - Level 1
    if (data.subdomains && Array.isArray(data.subdomains)) {
        data.subdomains.forEach((sub, idx) => {
            if (typeof sub !== 'string') return;
            const subId = `sub-${idx}`;
            // Simple truncation for display
            const label = sub.replace(data.target, '').replace(/\.$/, '') || sub;

            nodes.push({
                id: subId,
                type: 'subdomainNode',
                data: { label: label, full: sub },
                position: { x: 0, y: 0 },
            });
            edges.push({
                id: `e-${targetId}-${subId}`,
                source: targetId,
                target: subId,
                animated: true,
                style: { stroke: '#3b82f6' } // Blue edge
            });
            addedIds.add(subId);
        });
    }

    // 4. Vulnerabilities (Nuclei) - Level 2 (Attach to Root or Subdomain if matched?)
    // Matching vulns to subdomains is hard without strict URL mapping. 
    // We will attach them to Root for now, but color them Red.
    if (data.nuclei_data && Array.isArray(data.nuclei_data)) {
        data.nuclei_data.forEach((vuln, idx) => {
            const vulnId = `vuln-${idx}`;
            // Try to find if vuln belongs to a subdomain node
            let parentId = targetId;
            // (Simple heuristic: if vuln.host includes subdomain)

            const severity = vuln.info?.severity || 'unknown';

            nodes.push({
                id: vulnId,
                type: 'vulnNode',
                data: { label: vuln.templateID || 'Vuln', severity: severity },
                position: { x: 0, y: 0 },
            });

            edges.push({
                id: `e-${parentId}-${vulnId}`,
                source: parentId,
                target: vulnId,
                animated: true,
                style: { stroke: '#ef4444' } // Red edge
            });
        });
    }

    // Apply Layout
    return {
        nodes: positionGraph(nodes, edges),
        edges
    };
};
