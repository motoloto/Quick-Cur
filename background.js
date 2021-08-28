// background.js

let color = '#3aa757';

chrome.runtime.onStartup.addListener(() => {
  retrieveExchangeRate();
});
chrome.runtime.onInstalled.addListener(() => {
  retrieveExchangeRate();
});


function getExchangeRateFromStore(currencyMap) {
  return new Promise(resolve => {
    chrome.storage.local.get("exchangeRates", function (result) {
      // console.log('Value set is ' + JSON.stringify(result));
      resolve(result.exchangeRates[`${currencyMap}`]);
    });
  })
}

function makeExchange(rateKey,info) {
  Promise.all([getExchangeRateFromStore(`USD${rateKey[0]}`), getExchangeRateFromStore(`USD${rateKey[1]}`)]).then(values => {
    const rateToUSD = values[0].Exrate;
    const rateToTarget = values[1].Exrate;
    const amount = Number(info.selectionText) / rateToUSD * rateToTarget;
    if (!isNaN(amount)) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { "amount": amount, "targetCcy":rateKey[1] }, function (response) {
          console.log(response);
        });
      });
    }
  });
}


// right-click menu
chrome.contextMenus.create(
  { id: "rootMenu", title: "將所選金額： %s", contexts: ["selection"] },
  function () {
    if (chrome.extension.lastError) {
      console.log("Got expected error: " + chrome.extension.lastError.message);
    }
  });
chrome.contextMenus.create(
  { id: "USDtoTWD", title: "美金轉台幣", type: "normal", parentId: "rootMenu", contexts: ["selection"] });


chrome.contextMenus.create(
  { id: "TWDtoUSD", title: "台幣轉美金", type: "normal", parentId: "rootMenu", contexts: ["selection"] });

  chrome.contextMenus.create(
    { id: "JPYtoTWD", title: "日圓轉台幣", type: "normal", parentId: "rootMenu", contexts: ["selection"] });

chrome.contextMenus.onClicked.addListener(
  (info, tab) => {
    let rate = null;
    rateKey= info.menuItemId.split("to");
    makeExchange(rateKey, info)
  }

);


function retrieveExchangeRate(){
fetch('https://tw.rter.info/capi.php', {
  method: 'GET', // *GET, POST, PUT, DELETE, etc.
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'same-origin',
  redirect: 'follow', // manual, *follow, error
  referrer: 'no-referrer', // *client, no-referrer
}).catch(error => console.error('Error:', error))
  .then(response => response.json())
  .then(text => {
    // console.log("exchangeRates", text);
    const currentTime = new Date();
    chrome.storage.local.set({ "exchangeRates": text, "dataUpdateTime": `${currentTime}` },
      function () {
        if (chrome.extension.lastError) {
          console.log("Got expected error: " + chrome.extension.lastError.message);
        }
      });
  });
}