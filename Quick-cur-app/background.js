// background.js

chrome.runtime.onMessage.addListener(eventListener);

chrome.runtime.onStartup.addListener(() => {
  retrieveExchangeRate();
});

chrome.runtime.onInstalled.addListener((details) => {
  retrieveExchangeRate();
  
  if(details.reason === 'install'){
    console.log("New installation!");

    setDefaultCcyMapping();
    chrome.tabs.create({
      url: 'options.html'
    },
    function(tab){
      chrome.tabs.sendMessage(tab.id, {event: "extensionInstall"},{}, function(res){ console.log(res)});
    });
    
  }else if(details.reason == "update"){
    console.log("Component Upgrade!");
    updateMenu(); // menu will be destroyed when extension upgrades.
    chrome.tabs.create({
      url: 'options.html'
    },
    function(tab){
      console.log("tab Id " + tab.id);
      
      setTimeout(async function () {
        const [tabs] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const res = await chrome.tabs.sendMessage(tab.id, {event: "extensionUpdate"});
      },1000);
      
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

// Add a function to record the last 10 currency exchanges
function recordExchange(exchange) {
  return new Promise((resolve) => {
    chrome.storage.local.get("recentExchanges", (result) => {
      let exchanges = result.recentExchanges || [];
      const lastExchange = exchanges[0] || null;
      exchanges.unshift(exchange);
      if (exchanges.length > 10) {
        exchanges.pop();
      }
      chrome.storage.local.set({ recentExchanges: exchanges }, () => {
        resolve(lastExchange);
      });
    });
  });
}

// Update makeExchange to record the exchange and send the last result
async function makeExchange(rateKey, info) {
  const values = await Promise.all([
    getExchangeRateFromStore(`USD${rateKey[0].trim()}`),
    getExchangeRateFromStore(`USD${rateKey[1].trim()}`)
  ]);

  const rateToUSD = values[0].Exrate;
  const rateToTarget = values[1].Exrate;
  const totalRate = rateToTarget / rateToUSD;
  const sourceAmount = extractOnlyNumber(info.selectionText);
  const sourceAmountNumber = Number(sourceAmount);
  const amount =sourceAmountNumber / rateToUSD * rateToTarget;

  if (!isNaN(amount)) {
    const exchange = {
      from: rateKey[0],
      to: rateKey[1],
      sourceAmount: sourceAmountNumber.toFixed(2),
      amount: amount.toFixed(2),
      rate: totalRate.toFixed(3),
      timestamp: new Date().toISOString()
    };
    const lastExchange = await recordExchange(exchange);

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { "amount": amount, "targetCcy": rateKey[1], "totalRate": totalRate, "lastExchange": lastExchange }, function (response) {
        console.log(response);
        return true;
      });
    });
  }
}

function retrieveExchangeRate() {
  fetch('https://tw.rter.info/capi.php', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const currentTime = new Date().toISOString();
      return setToStorage({ exchangeRates: data, dataUpdateTime: currentTime });
    })
    .catch((error) => console.error('Error:', error));
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
  chrome.contextMenus.removeAll(() => {
    const selectedAmount = getMessage("selectedAmount");
    chrome.contextMenus.create({
      id: "rootMenu",
      title: `${selectedAmount}： %s`,
      contexts: ["selection"],
    });

    mappings.forEach((map) => {
      const [from, to] = map.split("|");
      chrome.contextMenus.create({
        id: `${from}to${to}`,
        title: `${from.trim()} => ${to.trim()}`,
        parentId: "rootMenu",
        contexts: ["selection"],
      });
    });

    chrome.contextMenus.create({
      id: "option",
      title: "[Add New convertting set]",
      parentId: "rootMenu",
      contexts: ["selection"],
    });
  });
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
  getFromStorage("currencyMappings").then(prepareContextMenuBySetting);
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

function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
}

function setToStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}


