chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.runtime.sendMessage({ action: "getStatus", tabId: tabs[0].id }, function(response) {
        if (response && response.status) {
            document.getElementById('status').textContent = "Status: " + response.status;
        } else {
            document.getElementById('status').textContent = "No status available";
        }
    });
});
