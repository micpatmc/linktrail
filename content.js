// This script runs on every page load

// You can add specific logic here to detect user activity on the page if needed

// Send a message to the background script when the page is loaded
chrome.runtime.sendMessage({ message: 'pageLoaded' });
