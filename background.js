// background.js

chrome.runtime.onMessage.addListener(eventListener);

chrome.runtime.onStartup.addListener(() => {
  retrieveExchangeRate();
});
chrome.runtime.onInstalled.addListener((details) => {
  retrieveExchangeRate();
  
  if(details.reason === 'install'){
    setDefaultCcyMapping();
    chrome.tabs.create({
      url: 'options.html'
    });
    
  }else if(details.reason == "update"){
    chrome.tabs.create({
      url: 'options.html'
    });
  }
});


chrome.contextMenus.onClicked.addListener(
  (info, tab) => {
    if(info.menuItemId === 'option'){
      chrome.runtime.openOptionsPage() ;
    }else{
    let rateKey = info.menuItemId.split("to");
    makeExchange(rateKey, info)
    }
  }
);
function getMessage(key){
  // Google Manifest 3 bug. can't use it. https://groups.google.com/a/chromium.org/g/chromium-extensions/c/dG6JeZGkN5w
  // return chrome.i18n.getMessage(key);
  const lang = navigator.language;
  console.log(lang);
  if(lang== "zh"){
    return "轉換金額";
  }else{
    return "Convert Number"
  }
}

function getExchangeRateFromStore(currencyMap) {
  return new Promise(resolve => {
    chrome.storage.local.get("exchangeRates", function (result) {
      // console.log('Value set is ' + JSON.stringify(result));
      resolve(result.exchangeRates[`${currencyMap}`]);
    });
  })
}

function extractOnlyNumber(text){
  const reges = /(\d*\d{1,3}(,\d{3})*(\.\d+)*)/;
  matchResult = text.match(reges);
  getText = matchResult[0];
  getText = getText.replaceAll(',','');
  return getText;
}


function makeExchange(rateKey, info) {
  Promise.all([getExchangeRateFromStore(`USD${rateKey[0]}`), getExchangeRateFromStore(`USD${rateKey[1]}`)]).then(values => {
    const rateToUSD = values[0].Exrate;
    const rateToTarget = values[1].Exrate;
    const totalRate =  rateToTarget / rateToUSD;
    const amount = Number(extractOnlyNumber(info.selectionText)) / rateToUSD * rateToTarget;
    if (!isNaN(amount)) {
      chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { "amount": amount, "targetCcy": rateKey[1], "totalRate": totalRate }, function (response) {
          console.log(response);
          return true;
        });
      });
    }
  });
}




function retrieveExchangeRate() {
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

function setDefaultCcyMapping() {
  const defaultCcyMapping = [
    "CNH|TWD",
    "USD|TWD",
    "JPY|TWD",
    "EUR|TWD",
    "CAD|USD",
    "CNH|USD",
    "EUR|USD"
  ];
  chrome.storage.local.set({ "currencyMappings": defaultCcyMapping },
    function () {
      if (chrome.extension.lastError) {
        console.log("Got expected error: " + chrome.extension.lastError.message);
      } else {
        prepareContextMenuBySetting(defaultCcyMapping);
      }
    });
}

function prepareContextMenuBySetting(mappings) {
  chrome.contextMenus.removeAll();
  const selectedAmount = getMessage("selectedAmount");
  chrome.contextMenus.create(
    { id: "rootMenu", title: selectedAmount+"： %s", contexts: ["selection"] },
    function () {
      if (chrome.extension.lastError) {
        console.log("Got expected error: " + chrome.extension.lastError.message);
      }
    });
  mappings.forEach(map => {
    currencies = map.split("|");
    chrome.contextMenus.create(
      { id: `${currencies[0]}to${currencies[1]}`, title: `${currencies[0]} => ${currencies[1]}`, type: "normal", parentId: "rootMenu", contexts: ["selection"] });
  })

  //shortcut to option page
  chrome.contextMenus.create(
    { id: `option`, title: `Can't find I want`, type: "normal", parentId: "rootMenu", contexts: ["selection"] });

}

function getCurrentMappings() {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get("currencyMappings", function (result) {
      resolve(result.currencyMappings);
    });
  });
}

function setCurrentMappings(mappingSet) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.set({ "currencyMappings": [...mappingSet] }, function (result) {
      resolve();
    });
  });
}

function refreshOptions(){
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { "event": "refreshOptions"}, function (response) {
      console.log(response);
    });
  });
}

function renewCurrencyMapping(newCcyMap) {
  
  setCurrentMappings(newCcyMap).then(element => {
    updateMenu();
    console.log("Renew CurrencyMapping done");
    // refreshOptions();
    return newCcyMap;
  });
  
}


function addCurrencyMapping(newCcyMap) {
  if (newCcyMap && newCcyMap[0] && newCcyMap[1]) {
    let mappings = getCurrentMappings().then(mappings => {
      let mappingSet = new Set(mappings);
      mappingSet.add(`${newCcyMap[0]}|${newCcyMap[1]}`);
      setCurrentMappings(mappingSet).then(element => {
        updateMenu();
        console.log("Update CurrencyMapping done");
        refreshOptions();
        return mappingSet;
      });
    });
  }
}

function removeFromCurrencyMapping(mapToDelete) {
  if (mapToDelete && mapToDelete[0] && mapToDelete[1]) {
    let mappings = getCurrentMappings().then(mappings => {
      let mappingSet = new Set(mappings);
      mappingSet.delete(`${mapToDelete[0]}|${mapToDelete[1]}`);
      console.log("Deleted mappingSet",mappingSet, " mapToDelete ",mapToDelete);

      setCurrentMappings(mappingSet).then(element => {
        updateMenu();
        console.log("Update CurrencyMapping done");
        refreshOptions();
        return mappingSet;
      });
    });
  }
}


function updateMenu() {
  chrome.storage.local.get("currencyMappings", function (result) {
    prepareContextMenuBySetting(result.currencyMappings);
  });
}

function eventListener(message, sender, sendResponse) {
  if (message.event === "updateMenu") {
    updateMenu();
    sendResponse({ result: "update menu completed" });
    // chrome.storage.local.get("currencyMappings", function (result) {
    //   prepareContextMenuBySetting(result.currencyMappings);
    //   sendResponse({ result: "update menu completed" });
    // });
  } else if (message.event === "deleteMap") {
    const result = removeFromCurrencyMapping(message.data);
    sendResponse(result);
    console.log("deleteMap done: ", message.data);
  } else if (message.event === "addMap") {
    const result = addCurrencyMapping(message.data);
    sendResponse(result);
    console.log("addMap done: ", message.data);

  } else if (message.event === "renewMap") {
    const result = renewCurrencyMapping(message.data);
    sendResponse(result);
    console.log("renewMap done: ", message.data);

  } 
}


