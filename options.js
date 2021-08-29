//TODO add remove currency map function

function displayCurrentMappingList() {
    chrome.storage.local.get("currencyMappings", function (result) {
        console.log('Value set is ' + JSON.stringify(result));

        result.currencyMappings.forEach(element => {

            var node = document.createElement("LI");
            var textNode = document.createTextNode(`${element[0]} -> ${element[1]}`);
            node.appendChild(textNode);
            document.getElementById("mappingList").appendChild(node);
        });
    });
}

function addCurrencyMapping(newCcyMap) {
    if(newCcyMap && newCcyMap[0] && newCcyMap[1]){
        chrome.storage.local.get("currencyMappings", function (result) {
            let mappingSet = new Set(result.currencyMappings);
            mappingSet.add(newCcyMap);
            chrome.storage.local.set({ "currencyMappings": [...mappingSet]},
                function () {
                    refresh();
                    if (chrome.extension.lastError) {
                        console.log("Got expected error: " + chrome.extension.lastError.message);
                    }
                    chrome.runtime.sendMessage({ event: "updateMenu" }, function(response) {  
                        console.log(response);  
                    });  
                });
        });
    }
    
}

function handleButtonClick(event) {
      const sourceCcy = document.getElementById("sourceCcy").value;
      const targetCcy = document.getElementById("targetCcy").value;
      addCurrencyMapping([sourceCcy, targetCcy]);
    }

function refresh(){
    let mappingList =document.getElementById("mappingList");
    mappingList.innerHTML='';
    displayCurrentMappingList();
}    

document.getElementById("addCcyMapping").addEventListener("click",handleButtonClick);
refresh();
