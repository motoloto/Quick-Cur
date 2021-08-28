

// changeColor.addEventListener("click", async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: setPageBackgroundColor,
//   });
// });

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

function getExchangeRateFromStore(currencyMap) {
  return new Promise(resolve => {
    chrome.storage.local.get("updateUpdateTime", function (result) {
      // console.log('Value set is ' + JSON.stringify(result));
      resolve(result.exchangeRates[`${currencyMap}`]);
    });
  })
}


chrome.storage.local.get("dataUpdateTime", function (result) {
  let changeColor = window.document.getElementById("storageUpdateTime");
  changeColor.innerHTML=`${result.dataUpdateTime}`;
});