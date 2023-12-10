// Key = Website origin; Value = Category type
const categoryMap = new Map([
  ["chrome://newtab", "Utilities"],
  ["https://www.w3schools.com", "Education"],
]);

// Key = Category type; Value = RGB color value
const colorMap = new Map([
  ["Productivity", "rgb(255, 0, 0, 0.06)"],
  ["Education", "rgb(0, 255, 0, 0.06)"],
  ["Utilities", "rgb(0, 0, 255, 0.06)"],
]);

// Current categories:
// Social
// Utilities
// Productivity
// Finance
// Education
// Shopping & Food
// Entertainment
// Health & Fitness

// Run every time the popup is opened
document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime.sendMessage(
    { message: "getTabData" },
    async function (response) {
      const content = document.querySelector(".content");
      var actualTotalTime = 0;

      // Create an array to store buttons
      const buttons = [];

      // Calculate the overall time for progress bar calculations
      for (const tabURL in response.tabData) {
        actualTotalTime += response.tabData[tabURL].totalTime / 1000;
      }

      // Create buttons to add into array
      for (const tabURL in response.tabData) {
        const tabInfo = response.tabData[tabURL];
        buttons.push(createButton(tabInfo, actualTotalTime));
      }

      // Sort the buttons based on time
      buttons.sort((buttonA, buttonB) => {
        const timeA = buttonA.dataset.time;
        const timeB = buttonB.dataset.time;
        return timeB - timeA; // Sort in descending order
      });

      // Append the sorted buttons to the content div
      buttons.forEach((button) => content.appendChild(button));

      // Call function to check for button clicks
      checkButtonClicks([...buttons]);

      // Get the sorting data
      chrome.storage.local.get("sortingData", function (result) {
        sortContent(result.sortingData, buttons);
        console.log("Data loaded:", result.sortingData);
        callback(data);
      });
    }
  );
});

function createButton(tabInfo, actualTotalTime) {
  // Create the button
  const button = document.createElement("button");
  button.className = "content-button";

  button.addEventListener("click", function () {
    // Open a new tab with the specified URL
    chrome.tabs.create({ url: `${tabInfo.origin}` }); // Replace with your desired URL
  });

  // Create category
  const categoryButton = document.createElement("button");
  categoryButton.className = "category-button";

  // Create Text for the category
  const categoryParagraph = document.createElement("p");
  categoryParagraph.id = "category";

  // Fill in the category based on global map
  if (categoryMap.has(tabInfo.origin)) {
    categoryParagraph.textContent = categoryMap.get(tabInfo.origin);
    categoryButton.style.backgroundColor = colorMap.get(
      categoryParagraph.textContent
    );
  } else {
    categoryParagraph.textContent = "None";
    categoryButton.backgroundColor = "rgb(0, 0, 0, 0.06)";
  }

  categoryButton.appendChild(categoryParagraph);

  // Website icon image element
  const img = document.createElement("img");
  img.id = "image";

  if (tabInfo.favicon == "") img.src = "../public/Backup.png";
  else img.src = tabInfo.favicon;

  // Create the first paragraph element with ID "name"
  const nameParagraph = document.createElement("p");
  nameParagraph.id = "name";
  nameParagraph.textContent = tabInfo.url;

  // Convert seconds into hours, minutes, and seconds
  const totalSeconds = tabInfo.totalTime / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const timeParagraph = document.createElement("p");
  timeParagraph.id = "time";

  if (hours > 0)
    timeParagraph.textContent = `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  else if (minutes > 0)
    timeParagraph.textContent = `${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  else timeParagraph.textContent = `${seconds.toString().padStart(2, "0")}s`;

  // Create the progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  const progressWidth = (tabInfo.totalTime / 1000 / actualTotalTime) * 100;
  progressBar.style.width = `${progressWidth / 3}%`;

  const progressBarBackground = document.createElement("div");
  progressBarBackground.className = "progress-bar-background";
  progressBarBackground.style.width = `${100 / 3}%`;

  const progressParagraph = document.createElement("p");
  progressParagraph.id = "progress-value";
  progressParagraph.textContent = progressWidth.toFixed(1) + "%";

  // Append the image, paragraphs, and progress bar to the button
  button.appendChild(img);
  button.appendChild(categoryButton);
  button.appendChild(progressBarBackground);
  button.appendChild(progressBar);
  button.appendChild(nameParagraph);
  button.appendChild(timeParagraph);
  button.appendChild(progressParagraph);

  // Set time to sort with
  button.dataset.time = tabInfo.totalTime;
  button.dataset.category = categoryParagraph.textContent;

  return button;
}

// Ability to set filters for buttons
function filterContent(item, buttons) {
  // Save the filter setting
  chrome.storage.local.set({ filterData: item }, function () {
    console.log("Data saved:", item);
  });

  var filteredButtons = buttons;

  // Sort the buttons based on the category
  for (let i = filteredButtons.length - 1; i >= 0; i--) {
    if (filteredButtons[i].dataset.category !== item) {
      filteredButtons.splice(i, 1);
    }
  }

  const content = document.querySelector(".content");

  // Remove existing buttons
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  // Place filter buttons into the DOM
  filteredButtons.forEach((button) => content.appendChild(button));
}

// Handle button sorting
function sortContent(item, buttons) {
  // Save the sorting value
  chrome.storage.local.set({ sortingData: item }, function () {
    console.log("Data saved:", item);
  });

  const sortText = document.querySelector("#sort-text");

  // Sort the buttons based on descending time
  if (item == "Usage-HighToLow") {
    sortText.textContent = "Usage Time (High to low)";

    buttons.sort((buttonA, buttonB) => {
      const timeA = buttonA.dataset.time;
      const timeB = buttonB.dataset.time;
      return timeB - timeA;
    });
  }
  // Sort the buttons based on ascending time
  else if (item == "Usage-LowToHigh") {
    sortText.textContent = "Usage Time (Low to high)";

    buttons.sort((buttonA, buttonB) => {
      const timeA = buttonA.dataset.time;
      const timeB = buttonB.dataset.time;
      return timeA - timeB;
    });
  }
  // Sort the buttons based on categories, in alphabetical order
  else if (item == "Category-HighToLow") {
    sortText.textContent = "Category (Alphabetical)";

    buttons.sort((buttonA, buttonB) => {
      const categoryA = buttonA.dataset.category;
      const categoryB = buttonB.dataset.category;
      if (categoryA != "None" && categoryB == "None") return -1;
      if (categoryA == "None" && categoryB != "None") return 1;
      return categoryA.localeCompare(categoryB);
    });
  }
  // Sort the buttons based on categories, in alphabetical order
  else if (item == "Category-LowToHigh") {
    sortText.textContent = "Category (Reverse-Alphabetical)";

    buttons.sort((buttonA, buttonB) => {
      const categoryA = buttonA.dataset.category;
      const categoryB = buttonB.dataset.category;
      if (categoryA != "None" && categoryB == "None") return -1;
      if (categoryA == "None" && categoryB != "None") return 1;
      return categoryB.localeCompare(categoryA);
    });
  }

  const content = document.querySelector(".content");
  buttons.forEach((button) => content.appendChild(button));
}

// Check if buttons are being clicked
function checkButtonClicks(buttons) {

  var filterProductivity = document.getElementById("filter-productivity");
  filterProductivity.addEventListener("click", function () {
    filterContent("Productivity", buttons);
  });

  var filterEducation = document.getElementById("filter-education");
  filterEducation.addEventListener("click", function () {
    filterContent("Education", buttons);
  });

  var filterUtilities = document.getElementById("filter-utilities");
  filterUtilities.addEventListener("click", function () {
    filterContent("Utilities", buttons);
  });

  var filterNone = document.getElementById("filter-none");
  filterNone.addEventListener("click", function () {
    filterContent("None", buttons);
  });

  var item1 = document.getElementById("item1");
  item1.addEventListener("click", function () {
    sortContent("Usage-HighToLow", buttons);
  });

  var item2 = document.getElementById("item2");
  item2.addEventListener("click", function () {
    sortContent("Usage-LowToHigh", buttons);
  });

  var item3 = document.getElementById("item3");
  item3.addEventListener("click", function () {
    sortContent("Category-HighToLow", buttons);
  });

  var item4 = document.getElementById("item4");
  item4.addEventListener("click", function () {
    sortContent("Category-LowToHigh", buttons);
  });
}
