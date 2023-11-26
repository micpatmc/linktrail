let activeTabURL;
let tabData = {};

function updateTabData(tabURL) {
  if (tabData[tabURL] && tabData[tabURL].startTime !== undefined) {
    if (isActiveTab(tabURL)) {
      const currentTime = Date.now();

      if (!tabData[tabURL].startTime) {
        // Initialize startTime if not already set
        tabData[tabURL].startTime = currentTime;
      }

      tabData[tabURL].totalTime += currentTime - tabData[tabURL].startTime;
      tabData[tabURL].startTime = currentTime;
    } else {
      tabData[tabURL].startTime = Date.now(); // Pause the timer if the tab is not active
    }
  }
}

function updateAllTabs() {
  console.log(tabData);
  console.log(activeTabURL);
  for (const tabURL in tabData) {
    // console.log(tabId + " " + activeTabId);
    updateTabData(tabURL);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Initialize or update tabData for the tab
    const shortenedURL = extractDomainAndPath(tab.url);
    activeTabURL = shortenedURL;
    if (!tabData[tab.url]) {
      console.log("New tab");

      console.log(shortenedURL);
      tabData[shortenedURL] = {
        url: shortenedURL,
        startTime: Date.now(),
        totalTime: 0,
      };
    } else {
      console.log("Old tab");
      tabData[shortenedURL].shortenedURL = shortenedURL;
    }
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  updateTabData(activeTabURL);

  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    // Window gained focus, update startTime for the active tab
    if (tabData[activeTabURL]) {
      tabData[activeTabURL].startTime = Date.now();
    }
  }
});

function extractDomainAndPath(url) {
  const urlObject = new URL(url);
  var shortenedPath = "/";

  for (var i = 1; i < urlObject.pathname.length; i++) {
    if (urlObject.pathname[i] == "/") break;

    shortenedPath += urlObject.pathname[i];
  }

  if (shortenedPath.length > 1) return urlObject.origin + shortenedPath;
  else return urlObject.origin;
}

// Periodically update all tabs to ensure accurate time tracking
setInterval(updateAllTabs, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getTabData") {
    updateTabData(activeTabURL); // Update the active tab before sending data
    console.log(tabData);
    sendResponse({ tabData });
  }
});

function isActiveTab(tabURL) {
  return tabURL === activeTabURL;
}
