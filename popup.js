



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