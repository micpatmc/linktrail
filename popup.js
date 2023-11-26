document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime.sendMessage({ message: "getTabData" }, function (response) {
    const tableBody = document.getElementById("tableBody");
    for (const tabURL in response.tabData) {
      const tabInfo = response.tabData[tabURL];

      // Check if a row with the same URL already exists
      const existingRow = Array.from(tableBody.rows).find(
        (row) => row.cells[0].textContent === tabInfo.url
      );
      // if (existingRow) {
      // Update the existing row
        // const existingTime = parseFloat(existingRow.cells[1].textContent);
        // existingRow.cells[1].textContent = ((existingTime || 0) + tabInfo.totalTime / 1000).toFixed(2) + 's';
      // } else {
      // Create a new row
      const row = tableBody.insertRow();
      row.insertCell(0).textContent = tabInfo.url;
      row.insertCell(1).textContent =
        (tabInfo.totalTime / 1000).toFixed(2) + "s";
      // }
    }

    // Convert HTMLCollection to an array
    const rowsArray = Array.from(tableBody.rows);

    // Sort the array based on the values in the second column
    rowsArray.sort((rowA, rowB) => {
      const timeA = parseFloat(rowA.cells[1].textContent);
      const timeB = parseFloat(rowB.cells[1].textContent);
      return timeB - timeA; // Sort in descending order, change to timeA - timeB for ascending order
    });

    // Clear the existing rows in the table
    tableBody.innerHTML = "";

    // Append the sorted rows back to the table
    rowsArray.forEach((row) => {
      tableBody.appendChild(row);
    });
  });
});
