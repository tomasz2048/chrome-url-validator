function createWarningPopup() {
    const popup = document.createElement('div');
    popup.innerHTML = `
        <div style="position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border: 1px solid black; z-index: 1000;">
            <p>Warning: Username "abc" detected!</p>
            <button id="closePopup">Close</button>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('closePopup').onclick = function() {
        popup.remove();
    };
}

chrome.runtime.sendMessage({ action: "getStatusForContentScript" }, function(response) {
    console.log("hello2")
    if (response.status === 'non-verizon') {
        document.addEventListener('DOMContentLoaded', function() {
            const inputElements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="username"]');

            inputElements.forEach(input => {
                input.addEventListener('blur', function() {
                    if (input.value === 'abc') {
                        createWarningPopup();
                    }
                });
            });
        });
    }
});
