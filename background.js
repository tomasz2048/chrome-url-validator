const URL_SERVICE = 'http://127.0.0.1:8002/vz_urls'; // URL to fetch domains
const GLOBAL_ICON = 'icons/blue16.png';
const VERIZON_ICON = 'icons/verizon16.png';
const DEFAULT_ICON = 'icons/transparent16.png';

//const SOFT_EXPIRATION_HOURS = 25; // Time until soft expiration
//const HARD_EXPIRATION_HOURS = 48; // Time until hard expiration
//const FIXED_POSTPONE_MINUTES = 60; // Fixed postponement time
//const RANDOM_POSTPONE_MINUTES = 30; // Randomization range for postponement
const SOFT_EXPIRATION_HOURS = 0.016; // Time until soft expiration //1 minute
const HARD_EXPIRATION_HOURS = 0.032; // Time until hard expiration
const FIXED_POSTPONE_MINUTES = 2; // Fixed postponement time
const RANDOM_POSTPONE_MINUTES = 1; // Randomization range for postponement

async function fetchDomains() {
    const now = Date.now();
    chrome.storage.local.get(['lastFetch', 'softExpiration', 'hardExpiration'], async (data) => {
        if (!data.lastFetch || now > data.softExpiration || now > data.hardExpiration) {
            // Attempt to fetch new domains regardless of soft or hard expiration
            try {
                const response = await fetch(URL_SERVICE);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const domains = await response.json();
                updateExpirationTimes(now, true); // Successfully fetched, reset expiration times
                chrome.storage.local.set({domains, lastFetch: now});
            } catch (error) {
                console.error('Failed to fetch domains:', error);

                updateExpirationTimes(now, false); // Fetch failed, only postpone next attempt
                if (now > data.hardExpiration) {
                    // If hard expiration is reached, clear domains and use default icon
                    chrome.storage.local.set({domains: []});
                    setDefaultIcon();
                    console.log("hard expiration reached, wiping out domains")
                }
            }
        }
        // If not yet reached any expiration, do nothing
    });
}

function updateExpirationTimes(now, success) {
    const softExpiration = now + SOFT_EXPIRATION_HOURS * 3600000;
    // When success is false, keep the hard expiration time unchanged if it already exists.
    chrome.storage.local.get(['hardExpiration'], function(data) {
        const currentHardExpiration = data.hardExpiration;
        const nextSoftExpiration = success ? softExpiration : now + FIXED_POSTPONE_MINUTES * 60000 + (Math.random() - 0.5) * 2 * RANDOM_POSTPONE_MINUTES * 60000;
        let nextHardExpiration;
        if (success) {
            // Extend both soft and hard expiration times upon successful fetch.
            nextHardExpiration = now + HARD_EXPIRATION_HOURS * 3600000;
        } else {
            // Do not extend hard expiration if fetch was not successful.
            nextHardExpiration = currentHardExpiration ? currentHardExpiration : now + HARD_EXPIRATION_HOURS * 3600000;
        }
        console.log("Update expiration times on success:"+ success +  " ::  soft expiration: "+ new Date(nextSoftExpiration).toLocaleTimeString() + " ; hard expiration: "+ new Date(nextHardExpiration).toLocaleTimeString())
        chrome.storage.local.set({ softExpiration: nextSoftExpiration, hardExpiration: nextHardExpiration });
    });
}

function checkAndUpdateIcon(tab) {
    if (!tab.url) return; // Exit if the tab lacks a URL (e.g., a new tab page).

    chrome.storage.local.get(['domains', 'softExpiration', 'hardExpiration'], function(data) {
        const now = Date.now();
        const { domains = [], softExpiration, hardExpiration } = data;

        // If current time is beyond soft expiration, try to fetch new domains.
        if (now > softExpiration || !domains.length) {
            fetchDomains();
        } else {
            // If within expiration limits, update icon based on the current domain list.
            updateIconBasedOnDomain(tab, domains);
        }
    });
}

function updateIconBasedOnDomain(tab, domains) {
    // Immediately apply the transparent icon if the domain list is empty.
    if (!domains.length || domains.length === 0) {
        setDefaultIcon(tab.id);
        return;
    }
    try {
        const url = new URL(tab.url);
        const hostname = url.hostname;
        // Extract the domain from the hostname.
        const domain = hostname.substring(hostname.lastIndexOf('.', hostname.lastIndexOf('.') - 1) + 1);
        // Determine the icon path based on whether the domain is in the list.
        const iconPath = domains.includes(domain) ? VERIZON_ICON : GLOBAL_ICON;

        // Update the icon for the current tab.
        chrome.action.setIcon({tabId: tab.id, path: iconPath});
    } catch (error) {
        console.error('Error updating icon:', error);
        // Fallback to a default icon if there's an error (e.g., invalid URL).
        setDefaultIcon(tab.id);
    }
}

function setDefaultIcon() {
    chrome.action.setIcon({path: DEFAULT_ICON});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the "status" of the tab is "complete", indicating it has finished loading.
    if (changeInfo.status === 'complete') {
        checkAndUpdateIcon(tab);
    }
});


chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        // Ensure the tab has not been closed between the time it was activated and the time it's retrieved.
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
        }
        checkAndUpdateIcon(tab);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    const now = Date.now();
    const softExpiration = now + SOFT_EXPIRATION_HOURS * 3600000;
    const hardExpiration = now + HARD_EXPIRATION_HOURS * 3600000;
    chrome.storage.local.set({ softExpiration, hardExpiration });
    setDefaultIcon();
    fetchDomains()
    console.log("onInstalled: "+ "soft expiration: "+ new Date(softExpiration).toLocaleTimeString() + " ; hard expiration: "+ new Date(hardExpiration).toLocaleTimeString())
});