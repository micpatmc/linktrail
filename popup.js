document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({ message: 'getTabData' }, function (response) {
      const tableBody = document.getElementById('tableBody');
      for (const tabId in response.tabData) {
        const tabInfo = response.tabData[tabId];
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = tabInfo.url;
        row.insertCell(1).textContent = (tabInfo.totalTime / 1000).toFixed(2);
      }
    });
  });
  