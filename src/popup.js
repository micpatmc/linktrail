document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime.sendMessage(
    { message: "getTabData" },
    async function (response) {
      const content = document.querySelector(".content");
      var actualTotalTime = 0;

      // Create an array to store buttons
      const buttons = [];

      for (const tabURL in response.tabData) {
        actualTotalTime += (response.tabData[tabURL].totalTime / 1000);
      }

      for (const tabURL in response.tabData) {
        const tabInfo = response.tabData[tabURL];

        // Create the button and add it to the array
        buttons.push(createButton(tabInfo, actualTotalTime));
      }

      // Sort the buttons based on time
      buttons.sort((buttonA, buttonB) => {
        const timeA = buttonA.dataset.time;
        const timeB = buttonB.dataset.time;
        return timeB - timeA; // Sort in descending order
      });

      // Append the sorted buttons to the content div
      buttons.forEach(button => content.appendChild(button));
    }
  );
});

function createButton(tabInfo, actualTotalTime) {
  // Create the button
  const button = document.createElement("button");
  button.className = "content-button";
  
  button.addEventListener("click", function() {
    // Open a new tab with the specified URL
    chrome.tabs.create({ url: `${tabInfo.origin}` }); // Replace with your desired URL
  });

  console.log(tabInfo);

  // Create the image element
  const img = document.createElement("img");
  img.id = "image";

  if (tabInfo.favicon == "")
    img.src = "../public/Backup.png";
  else
    img.src = tabInfo.favicon;

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
    timeParagraph.textContent = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  else if (minutes > 0)
    timeParagraph.textContent = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  else
    timeParagraph.textContent = `${seconds.toString().padStart(2, '0')}s`;

  // Create the progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  const progressWidth = ((tabInfo.totalTime / 1000) / actualTotalTime) * 80;
  progressBar.style.width = `${progressWidth}%`;

  console.log(progressWidth);

  // Append the image, paragraphs, and progress bar to the button
  button.appendChild(img);
  button.appendChild(progressBar);
  button.appendChild(nameParagraph);
  button.appendChild(timeParagraph);

  button.dataset.time = tabInfo.totalTime;

  return button;
}
