const FETCH_INTERVAL_MS = 60000; // Interval to refresh domains, 60 seconds
const URL_SERVICE = 'http://127.0.0.1:8002/vz_urls'; // URL to fetch domains
const DEFAULT_ICON = 'icons/blue16.png';
const VERIZON_ICON = 'icons/verizon16.png';

async function fetchDomains() {
    try {
        const response = await fetch(URL_SERVICE);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const domains = await response.json();
        // Update domains and last fetch timestamp only if fetch is successful
        chrome.storage.local.set({ domains: domains, lastFetch: Date.now() }, () => {
            console.log("Domains updated successfully.");
        });
    } catch (error) {
        // Log error but do not clear existing domains
        console.warn('Failed to fetch domains, using existing collection:', error);
    }
}

function updateIcon(tab, domains) {
    if (!tab.url) return; // Add this line to check if tab.url is valid

    try {
        let url = new URL(tab.url);
        let hostname = url.hostname;
        let domain = hostname.substring(hostname.lastIndexOf('.', hostname.lastIndexOf('.') - 1) + 1);
        let iconPath = domains.includes(domain) ? VERIZON_ICON : DEFAULT_ICON;

        // Update the icon for the current tab
        chrome.action.setIcon({tabId: tab.id, path: iconPath});
    } catch (error) {
        console.error('Error updating icon:', error);
    }
}

function checkAndUpdateIcon(tab) {
    // Perform a check to ensure tab.url is valid
    if (!tab.url) return;

    chrome.storage.local.get(['domains', 'lastFetch'], function(data) {
        let now = Date.now();
        if (!data.domains || !data.lastFetch || (now - data.lastFetch > FETCH_INTERVAL_MS)) {
            // Data is old or missing, fetch new data
            fetchDomains().then(() => {
                chrome.storage.local.get(['domains'], function(newData) {
                    updateIcon(tab, newData.domains || []);
                });
            });
        } else {
            // Use cached data
            updateIcon(tab, data.domains);
        }
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        checkAndUpdateIcon(tab);
    }
});

// Listen for tab switches
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, checkAndUpdateIcon);
});
