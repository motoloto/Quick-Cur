
function genericOnClick(info, tab) {
    console.log("item " + info.menuItemId + " was clicked");
    console.log("info: " + JSON.stringify(info));
    console.log("tab: " + JSON.stringify(tab));
}

function checkboxOnClick(info, tab) {
    console.log(JSON.stringify(info));
    console.log("checkbox item " + info.menuItemId +
        " was clicked, state is now: " + info.checked +
        "(previous state was " + info.wasChecked + ")");


    fetch('https://tw.rter.info/capi.php', {
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, same-origin, *omit
        headers: {
            'Access-Control-Allow-Origin': 'origin-list',
            'content-type': 'application/json'
        },
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'no-cors', // no-cors, cors, *same-origin
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // *client, no-referrer
    })
        .catch(error => console.error('Error:', error))
        .then(response => {
            console.log(response.json());
        })

    console.log("done)");
}



console.log("About to try creating an invalid item - an error about " +
    "item 999 should show up");
chrome.contextMenus.create(
    { id: "rootMenu", title: "所選金額： %s", contexts: ["selection"] },
    function () {
        if (chrome.extension.lastError) {
            console.log("Got expected error: " + chrome.extension.lastError.message);
        }
    });
chrome.contextMenus.create(
    { id: "checkbox1", title: "轉換成台幣", type: "normal", parentId: "rootMenu", contexts: ["selection"] });
chrome.contextMenus.create(
    { id: "checkbox2", title: "轉換成美金", type: "normal", parentId: "rootMenu", contexts: ["selection"] });

async function helloWorld() {
    console.log("Hello, world!");
    let result = await fetch("https://tw.rter.info/capi.php", {
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, same-origin, *omit
        headers: {
            'content-type': 'text/plain',
            'Accept': 'application/json'
        },
        mode: 'cors',
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // *client, no-referrer
    }).then(response => response).catch(error => console.error('Error:', error));

    return result;
}

chrome.runtime.onInstalled.addListener(() => {
    helloWorld().then(response => {
        console.log(response.body);
    });
    console.log('onInstalled...');
    // create alarm after extension is installed / upgraded
    chrome.alarms.create('refresh', { periodInMinutes: 0.1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(alarm.name); // refresh
    helloWorld().then(response => {
        console.log(response);
    });
});

const url = 'https://www.taifex.com.tw/data_gov/taifex_open_data.asp?data_name=DailyForeignExchangeRates';

async function getIp() {
    try {
        const res = await fetch(url);
        return res.json();
    } catch (error) {
        console.log(error);
    }
}

getIp().then(response => {
	console.log(response);
});

