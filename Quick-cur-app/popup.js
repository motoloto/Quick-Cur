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

window.document.getElementById("toOption").addEventListener("click", (event)=>{
  chrome.runtime.openOptionsPage() ;
})

// Retrieve and display the last 10 currency exchanges
window.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get("recentExchanges", (result) => {
    const exchanges = result.recentExchanges || [];
    const exchangeList = document.getElementById("exchangeList");

    exchanges.forEach(exchange => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.textContent = `${exchange.amount} ${exchange.from} => ${exchange.to} (Rate: ${exchange.rate}) on ${new Date(exchange.timestamp).toLocaleString()}`;
      exchangeList.appendChild(listItem);
    });
  });
});