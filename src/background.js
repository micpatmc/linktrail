let activeTabURL;
let tabData = {};

// Update an individual tab for the timing
function updateTabData(tabURL) {
  if (tabData[tabURL] && tabData[tabURL].startTime !== undefined) {
    if (isActiveTab(tabURL)) {
      const currentTime = Date.now();

      if (!tabData[tabURL].startTime) {
        // Initialize startTime if not already set
        tabData[tabURL].startTime = currentTime;
      }

      tabData[tabURL].usageTime += currentTime - tabData[tabURL].startTime;
      tabData[tabURL].startTime = currentTime;
    } else {
      tabData[tabURL].startTime = Date.now(); // Pause the timer if the tab is not active
    }
  }
}

// Update ALL tabs in tabData
function updateAllTabs() {
  saveData(tabData);

  for (const tabURL in tabData) {
    updateTabData(tabURL);
  }
}

function getTabInfo(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(tab);
      }
    });
  });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Initialize or update tabData for the tab
    const shortenedURL = await extractDomainAndPath(tab.url);
    activeTabURL = shortenedURL;

    // Function to extract favicon from the current tab
    const extractFavicon = async (tabId) => {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: "extractFavicon" }, resolve);
      });
    };

    // If the favicon is not already present in tabData, extract and add it
    if (tabData[shortenedURL] && tabData[shortenedURL].favicon == undefined) {
      const faviconUrl = await extractFavicon(tabId);
      tabData[shortenedURL].favicon = faviconUrl;
    } else if (!tabData[shortenedURL]) {
      const faviconUrl = await extractFavicon(tabId);
      tabData[shortenedURL] = {
        url: shortenedURL,
        startTime: Date.now(),
        usageTime: 0,
        origin: new URL(tab.url).origin,
        favicon: faviconUrl,
      };
    }
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    // Window gained focus, update startTime for the active tab
    if (tabData[activeTabURL]) {
      tabData[activeTabURL].startTime = Date.now();
    }
  }
});

// Extract the domain and path of the URL
function extractDomainAndPath(url) {
  const urlObject = new URL(url);
  return urlObject.host;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getTabData") {
    updateTabData(activeTabURL);
    sendResponse({ tabData });
  }
});

function isActiveTab(tabURL) {
  return tabURL === activeTabURL;
}

// Function to store tab data in storage
function saveData(data) {
  chrome.storage.local.set({ usageData: data }, function () {});
}

// Function to retrieve tab data from storage
function loadData(callback) {
  chrome.storage.local.get("usageData", function (result) {
    tabData = result.usageData || [];
    callback(tabData);
  });
}

// Periodically update all tabs to ensure accurate time tracking
setInterval(updateAllTabs, 1000);

// Load the tab data
// loadData();
chrome.storage.sync.clear();
