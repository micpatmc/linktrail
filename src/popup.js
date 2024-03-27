// Run every time the popup is opened
document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime.sendMessage(
    { message: "getTabData" },
    async function (response) {
      const content = document.querySelector(".content");
      var totalTime = 0;

      // Create an array to store buttons
      const buttons = [];

      // Calculate the overall time for progress bar calculations
      for (const tabURL in response.tabData) {
        totalTime += response.tabData[tabURL].usageTime / 1000;
      }

      // Create buttons to add into array
      for (const tabURL in response.tabData) {
        const tabInfo = response.tabData[tabURL];
        buttons.push(createButton(tabInfo, totalTime));
      }

      // Sort the buttons based on time
      buttons.sort((buttonA, buttonB) => {
        const timeA = buttonA.dataset.time;
        const timeB = buttonB.dataset.time;
        return timeB - timeA; // Sort in descending order
      });

      // Append the sorted buttons to the content div
      buttons.forEach((button) => content.appendChild(button));

      if (buttons.length == 0) {
        zeroButtons();
        return;
      } 

      var filteredButtons = [];

      // Get the filter data and assign filtered buttons
      chrome.storage.local.get("filterData", function (result) {
        result.filterData.forEach((filter) => filteredButtons = toggleFilter("filter-" + filter, [...buttons]));
        callback(result);
      })
      
      // Call function to check for button clicks
      checkButtonClicks([...buttons], filteredButtons);
      
      // Create the initial doughnut chart
      createChart([...buttons]);
      
      // Set the statistics
      setStatistics([...buttons], totalTime);
      
      // Get the sorting data and place buttons
      chrome.storage.local.get("sortingData", function (result) {
        const sortKey = result.sortingData | "Usage-HighToLow";
        console.log(sortKey);
        sortContent(result.sortingData, filteredButtons);
        console.log("Data loaded:", result.sortingData);
        callback(result);
      });
    }
  );
});

function createChart(buttons) {
  // Get the canvas element
  var ctx = document.getElementById('myChart').getContext('2d');

  buttons.sort((buttonA, buttonB) => {
    const timeA = buttonA.dataset.time;
    const timeB = buttonB.dataset.time;
    return timeB - timeA;
  });
  buttons = buttons.slice(0, 10);

  // Data for the chart
  var data = {
    labels: buttons.map(function(button) {
      if (button.dataset.name.length > 17)
      {
        var truncatedName = button.dataset.name.substring(0, 18) + "...";
        return truncatedName;
      }

      return button.dataset.name;
    }),
    datasets: [{
      data: buttons.map(function(button) {
        return button.dataset.progress;
      }),
      backgroundColor: buttons.map(function(button) {
        return button.dataset.color;
      }),
      hoverBackgroundColor: buttons.map(function(button) {
        return getLighterColor(button.dataset.color, 20);
      }),
    }]
  };

  // Chart configuration
  var options = {
    cutout: 50,
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'right',
        maxHeight: 10,
      }
    }
  };

  // Create the doughnut chart
  new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options
  });
}


function createButton(tabInfo, totalTime) {
  // Create the button
  const button = document.createElement("button");
  button.className = "content-button";

  button.addEventListener("click", function () {
    // Open a new tab with the specified URL
    chrome.tabs.create({ url: `${tabInfo.origin}` }); // Replace with your desired URL
  });

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
  const totalSeconds = tabInfo.usageTime / 1000;
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
  const progressWidth = (tabInfo.usageTime / 1000 / totalTime) * 100;
  progressBar.style.width = `${progressWidth / 3}%`;

  const progressBarBackground = document.createElement("div");
  progressBarBackground.className = "progress-bar-background";
  progressBarBackground.style.width = `${100 / 3}%`;

  const progressParagraph = document.createElement("p");
  progressParagraph.id = "progress-value";
  progressParagraph.textContent = progressWidth.toFixed(1) + "%";

  // Append the image, paragraphs, and progress bar to the button
  button.appendChild(img);
  button.appendChild(progressBarBackground);
  button.appendChild(progressBar);
  button.appendChild(nameParagraph);
  button.appendChild(timeParagraph);
  button.appendChild(progressParagraph);

  // Set button data
  button.dataset.time = tabInfo.usageTime;
  button.dataset.name = nameParagraph.textContent;
  button.dataset.progress = progressWidth.toFixed(1);
  
  const storedData = localStorage.getItem(button.dataset.name + " : Color");
  console.log(storedData);
  if (storedData === null)
  {
    console.log("HERE");
    button.dataset.color = getRandomColor();
    localStorage.setItem(button.dataset.name + " : Color", JSON.stringify(button.dataset.color));
    
    // button.dataset.lightColor = getLighterColor(button.dataset.color, 20);
    // localStorage.setItem(button.nameParagraph.content + " : Light Color", JSON.stringify(button.dataset.color));
  }
  else
  {
    button.dataset.color = JSON.parse(localStorage.getItem(button.dataset.name + " : Color"));
  }

  return button;
}

// Ability to set filters for buttons
function filterContent(item, buttons) {
  // Save the filter setting
  chrome.storage.local.set({ filterData: item }, function () {
    console.log("Data saved:", item);
  });

  var filteredButtons = buttons;

  const content = document.querySelector(".content");

  // Remove existing buttons
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  // Place filter buttons into the DOM
  filteredButtons.forEach((button) => content.appendChild(button));

  // Return the filtered buttons
  return buttons;
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

  // Place buttons into the DOM
  const content = document.querySelector(".content");
  buttons.forEach((button) => content.appendChild(button));
}

// Check if buttons are being clicked
function checkButtonClicks(buttons, filteredButtons) {

  var item1 = document.getElementById("item1");
  item1.addEventListener("click", function () {
    sortContent("Usage-HighToLow", filteredButtons);
  });

  var item2 = document.getElementById("item2");
  item2.addEventListener("click", function () {
    sortContent("Usage-LowToHigh", filteredButtons);
  });
}

function setStatistics(buttons, totalTime) {
  const totalTimeStat = document.getElementById("stat-total-time");
  const usageStat = document.getElementById("stat-usage");
  const usageStatHighest = document.getElementById("stat-usage-highest");
  const usageStatLowest = document.getElementById("stat-usage-lowest");
  const trackingCount = document.getElementById("tracking-count");

  // Total time stat
  const totalSeconds = totalTime;
  var hours = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = Math.floor(totalSeconds % 60);

  if (hours > 0)
    totalTimeStat.textContent = `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  else if (minutes > 0)
    totalTimeStat.textContent = `${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  else totalTimeStat.textContent = `${seconds.toString().padStart(2, "0")}s`;
  
  // Usage stat
  buttons.sort((buttonA, buttonB) => {
    const timeA = buttonA.dataset.time;
    const timeB = buttonB.dataset.time;
    return timeB - timeA;
  });

  var highestTime = buttons[0].dataset.time / 1000;
  hours = Math.floor(highestTime / 3600);
  minutes = Math.floor((highestTime % 3600) / 60);
  seconds = Math.floor(highestTime % 60);

  if (hours > 0)
  usageStatHighest.textContent = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  else if (minutes > 0)
  usageStatHighest.textContent = `${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  else usageStatHighest.textContent = `${seconds.toString().padStart(2, "0")}s`;

  if (buttons[0].dataset.name.length >= 21)
    usageStat.textContent = buttons[0].dataset.name.substring(0, 22) + "...";
  else
    usageStat.textContent = buttons[0].dataset.name;

  buttons.sort((buttonA, buttonB) => {
    const timeA = buttonA.dataset.time;
    const timeB = buttonB.dataset.time;
    return timeA - timeB;
  });

  if (buttons[0].dataset.name.length >= 21)
    usageStatLowest.textContent = buttons[0].dataset.name.substring(0, 22) + "...";
  else
  usageStatLowest.textContent = buttons[0].dataset.name;

  trackingCount.textContent = "Tracking " + buttons.length + " Different Websites";
}

function getRandomColor() {
  var letters = 'BCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
}

function getLighterColor(color, percent) {
  percent = Math.min(100, Math.max(0, percent));

  // Convert hex to RGB
  var r = parseInt(color.slice(1, 3), 16);
  var g = parseInt(color.slice(3, 5), 16);
  var b = parseInt(color.slice(5, 7), 16);

  // Calculate lighter RGB values
  r = Math.floor(r + (255 - r) * (percent / 100));
  g = Math.floor(g + (255 - g) * (percent / 100));
  b = Math.floor(b + (255 - b) * (percent / 100));

  // Ensure values are within the valid range (0-255)
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);

  // Convert back to hex
  var lighterColor = '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);

  return lighterColor;
}

function saveData(data) {
  chrome.storage.local.set({ 'test': data }, function () {
    console.log('Data saved:', data);
  });
}

function zeroButtons() {
  document.querySelector(".main").style.display = "none";
  document.querySelector(".main-no-button").style.display = "flex";
  document.querySelector("#sort-text").textContent = "Usage-HighToLow";

  chrome.storage.local.set({ sortingData: "Usage-HighToLow" }, function () {
    console.log("Data saved:", "Usage-HighToLow");
  });
}

function toggleFilter(filterId, buttons) {
  var filterButton = document.getElementById(filterId);

  // Toggle the 'active' class on the clicked button
  filterButton.classList.toggle('active');

  var activeFilters = document.querySelectorAll('.filter-item.active');
  var filters = document.querySelectorAll('.filter-item');

  Array.from(filters).map(function (filter) {
    document.getElementById(filter.id).style.backgroundColor = '#fff';
    document.getElementById(filter.id).style.color = '#000';
  });

  const selectedFilters = Array.from(activeFilters).map(function (filter) {
    document.getElementById(filter.id).style.backgroundColor = '#08f';
    document.getElementById(filter.id).style.color = '#fff';
    
    return filter.id.replace('filter-', '');
  });

  console.log(selectedFilters);
  return filterContent(selectedFilters, [...buttons]);
}