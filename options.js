//TODO Avoid much IO process. make background return new map

function displayCurrentMappingList() {
    chrome.storage.local.get("currencyMappings", function (result) {

        result.currencyMappings.forEach(element => {
            var node = document.createElement("LI");
            node.className="list-group-item";

            const map =element.split("|");

            var button = document.createElement("BUTTON");
            button.setAttribute("id", `delete-${map[0]}-${map[1]}`)
            button.className=" btn-danger";
            button.innerHTML="X";
            button.addEventListener("click", deleteSelectMap( [map[0], map[1]]));
            node.appendChild(button);

            var textNode = document.createTextNode(`${map[0]} -> ${map[1]}`);
            node.appendChild(textNode);
            
            document.getElementById("mappingList").appendChild(node);
        });
    });
}

function deleteSelectMap(dataSet) {
    return (event)=>{
        chrome.runtime.sendMessage({ event: "deleteMap", data: dataSet}, function(response) {  
            return true;
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
