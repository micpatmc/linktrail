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

// Event listener for extension unload (when Chrome is closed)
chrome.runtime.onSuspend.addListener(function () {
  console.log("Chrome OFF");
  loadData(function (existingData) {
    saveData(tabData);
  });

});

// Event listener for extension startup (when Chrome is opened)
chrome.runtime.onStartup.addListener(function () {
  // Load data when the extension starts
  console.log("Chrome ON");
  loadData(function (data) {
    console.log('Extension started with data:', data);
  });

});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await getTabInfo(activeInfo.tabId);
  if (tab.url == "") activeTabURL = extractDomainAndPath(tab.pendingUrl);
  else activeTabURL = extractDomainAndPath(tab.url);

  if (!tabData[activeTabURL] && activeTabURL !== undefined) {
    tabData[activeTabURL] = {
      url: activeTabURL,
      startTime: Date.now(),
      totalTime: 0,
      origin: new URL(tab.url).origin,
      favicon: tab.favIconUrl,
    };
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Initialize or update tabData for the tab
    const shortenedURL = extractDomainAndPath(tab.url);
    activeTabURL = shortenedURL;
    if (!tabData[tab.url]) {
      console.log("New tab");

      tabData[shortenedURL] = {
        url: shortenedURL,
        startTime: Date.now(),
        totalTime: 0,
        origin: new URL(tab.url).origin,
        favicon: tab.favIconUrl,
      };
    } else {
      console.log("Old tab");
      tabData[shortenedURL].url = shortenedURL;
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

function extractDomainAndPath(url) {
  const urlObject = new URL(url);
  return urlObject.host;
}

// Periodically update all tabs to ensure accurate time tracking
setInterval(updateAllTabs, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getTabData") {
    updateTabData(activeTabURL); // Update the active tab before sending data
    sendResponse({ tabData });
  }
});

function isActiveTab(tabURL) {
  return tabURL === activeTabURL;
}

// Sample function to save data to storage
function saveData(data) {
  chrome.storage.local.set({ 'usageData': data }, function () {
    console.log('Data saved:', data);
  });
}

// Sample function to retrieve data from storage
function loadData(callback) {
  chrome.storage.local.get('usageData', function (result) {
    const data = result.usageData || [];
    console.log('Data loaded:', data);
    callback(data);
  });
}