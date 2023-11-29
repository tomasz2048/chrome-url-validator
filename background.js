let tabStatuses = {};  // Object to store status for each tab

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        fetch('http://127.0.0.1:8000/check_url/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: tab.url })
        })
            .then(response => response.json())
            .then(data => {
                tabStatuses[tabId] = data.status;
                updateIcon(tabId, data.status);
            })
            .catch(error => console.error('Error:', error));
    }
});

function updateIcon(tabId, status) {
    let iconPath;
    switch (status) {
        case 'verizon':
            iconPath = 'icons/verizon16.png';
            break;
        case 'suspicious':
            iconPath = 'icons/yellow16.png';
            break;
        case 'non-verizon':
            iconPath = 'icons/green16.png';
            break;
        default:
            iconPath = 'icons/default16.png';
            break;
    }
    chrome.action.setIcon({ path: iconPath, tabId: tabId });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getStatus" && typeof request.tabId !== 'undefined') {
        sendResponse({ status: tabStatuses[request.tabId] || 'Unknown123' });
    }
});