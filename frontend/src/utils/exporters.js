/**
 * Utility functions for exporting scan results in various formats
 */

export const exportToJSON = (data, filename = 'scan-results') => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
};

export const exportToCSV = (results, filename = 'scan-results') => {
    if (!results || results.length === 0) {
        console.warn('No results to export');
        return;
    }

    // Create CSV header
    const headers = ['Tool Name', 'Status', 'Summary'];
    const rows = [headers];

    // Add data rows
    results.forEach(result => {
        const summary = typeof result.result === 'string'
            ? result.result.substring(0, 200)
            : JSON.stringify(result.result).substring(0, 200);

        rows.push([
            result.tool_name,
            'Completed',
            `"${summary.replace(/"/g, '""')}"`  // Escape quotes
        ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
};

export const exportToMarkdown = (results, target, scanId, filename = 'scan-report') => {
    let markdown = `# Security Scan Report\n\n`;
    markdown += `**Target:** ${target}\n`;
    markdown += `**Scan ID:** ${scanId}\n`;
    markdown += `**Date:** ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    results.forEach(result => {
        markdown += `## ${result.tool_name}\n\n`;

        if (typeof result.result === 'string') {
            markdown += `\`\`\`\n${result.result}\n\`\`\`\n\n`;
        } else {
            markdown += `\`\`\`json\n${JSON.stringify(result.result, null, 2)}\n\`\`\`\n\n`;
        }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadBlob(blob, `${filename}.md`);
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err2) {
            document.body.removeChild(textArea);
            return false;
        }
    }
};

export const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper function to download blob
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
