//TODO Avoid much IO process. make background return new map

function displayCurrentMappingList() {
    chrome.storage.local.get("currencyMappings", function (result) {

        result.currencyMappings.forEach(element => {
            const map =element.split("|");
            var node = document.createElement("LI");
            var textNode = document.createTextNode(`${map[0]} -> ${map[1]}`);
            node.appendChild(textNode);
            var button = document.createElement("BUTTON");
            button.setAttribute("id", `delete-${map[0]}-${map[1]}`)
            button.innerHTML="X";
            button.addEventListener("click", deleteSelectMap( [map[0], map[1]]));
              node.appendChild(button);
            document.getElementById("mappingList").appendChild(node);
        });
    });
}

function deleteSelectMap(dataSet) {
    return (event)=>{
        chrome.runtime.sendMessage({ event: "deleteMap", data: dataSet}, function(response) {  
            // refresh();
            // chrome.runtime.sendMessage({ event: "updateMenu" }, function(response) {  
            //     console.log(response);  
            // });  
        });
    };
  }

function addCurrencyMapping(newCcyMap) {
    if(newCcyMap && newCcyMap[0] && newCcyMap[1]){
        chrome.runtime.sendMessage({ event: "addMap", data: [newCcyMap[0], newCcyMap[1]]}, function(response) {  
            // refresh();
            console.log(response);  
        }); 
    }
    
}

function handleButtonClick(event) {
      const sourceCcy = document.getElementById("sourceCcy").value;
      const targetCcy = document.getElementById("targetCcy").value;
      addCurrencyMapping([sourceCcy, targetCcy]);
    }

function refresh(){
    console.log("REFRESH!");
    let mappingList =document.getElementById("mappingList");
    mappingList.innerHTML='';
    displayCurrentMappingList();
}    

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.event === "refreshOptions") {
        refresh();
        sendResponse("refreshOptions done");
    }
});


document.getElementById("addCcyMapping").addEventListener("click",handleButtonClick);
refresh();
