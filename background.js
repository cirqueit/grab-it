chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command == 'capture') {
        chrome.tabs.captureVisibleTab(function(dataUrl) {
            sendResponse({screenshotUrl: dataUrl});
        });
    }
    return true;
});

chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {command: "toggle"}, function(response) {
        chrome.browserAction.setBadgeText({ text: response.text });
      });
    });
    return true;
});
