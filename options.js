//TODO Avoid much IO process. make background return new map
function localizeHtmlPage()
{
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
        {
            return v1 ? getMessage(v1) : "";
        });

        if(valNewH != valStrH)
        {
            obj.innerHTML = valNewH;
        }
    }
}
function getMessage(key){
    return chrome.i18n.getMessage(key);
}

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

function displayAvailableCcyList() {
    chrome.storage.local.get("exchangeRates", function (result) {
        for ( const [key] of Object.entries(result.exchangeRates)) {
            // extract currency from USDXXX
            if(key.startsWith('USD')){
                const ccy = key.slice(3);
                // console.log(ccy);
                var option = document.createElement("OPTION");
                option.innerHTML=`${ccy}`;
                option.className="list-group-item";
    
                document.getElementById("sourceCcy").appendChild(option);
                var option2 = option.cloneNode(true);
                document.getElementById("targetCcy").appendChild(option2);
            }
          }
    
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
    localizeHtmlPage();
    let mappingList =document.getElementById("mappingList");
    mappingList.innerHTML='';
    displayCurrentMappingList();
    displayAvailableCcyList();
}    

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.event === "refreshOptions") {
        refresh();
        sendResponse("refreshOptions done");
    }
});

refresh();
document.getElementById("addCcyMapping").addEventListener("click",handleButtonClick);

