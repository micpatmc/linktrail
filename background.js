let activeTabId;
let tabData = {};

function updateTabData(tabId) {
    if (tabData[tabId] && tabData[tabId].startTime !== undefined) {
        if (isActiveTab(tabId)) {
            console.log("TabId Match");

            const currentTime = Date.now();
            console.log(Date.now() + " " + tabData[tabId].startTime);

            if (!tabData[tabId].startTime) {
                // Initialize startTime if not already set
                tabData[tabId].startTime = currentTime;
            }
            
            tabData[tabId].totalTime += currentTime - tabData[tabId].startTime;
            tabData[tabId].startTime = currentTime;
        } else {
            tabData[tabId].startTime = Date.now(); // Pause the timer if the tab is not active
        }
    }
  }

function updateAllTabs() {
  for (const tabId in tabData) {
    // console.log(tabId + " " + activeTabId);
    updateTabData(tabId);
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateTabData(activeTabId);
  activeTabId = activeInfo.tabId;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Initialize or update tabData for the tab
    if (!tabData[tabId]) {
    console.log("New tab");
      tabData[tabId] = {
        url: tab.url,
        startTime: Date.now(),
        totalTime: 0,
      };
    } else {
        console.log("Old tab");
      tabData[tabId].url = tab.url;
    }
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  updateTabData(activeTabId);

  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    // Window gained focus, update startTime for the active tab
    if (tabData[activeTabId]) {
      tabData[activeTabId].startTime = Date.now();
    }
  }
});

// Periodically update all tabs to ensure accurate time tracking
setInterval(updateAllTabs, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'getTabData') {
    updateTabData(activeTabId); // Update the active tab before sending data
    sendResponse({ tabData });
  }
});

function isActiveTab(tabId) {
    return tabId === activeTabId;
}