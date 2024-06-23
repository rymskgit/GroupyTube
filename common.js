const trashUrl = chrome.runtime.getURL("images/trash.png");

let subscriptionChannels = [];
let lastsaveGroups = [];
let lastsaveSettings = [];

function getSubPopupDocument() {

    const subpopup = document.querySelector("#subpopup") ?? null;
    if (subpopup === null) {
        return;
    }

    const subDocument = subpopup.contentWindow.document;

    return subDocument;
}

// update status bar
function updateStatusBar(message) {

    const statusbar = document.querySelector('#status-bar') ?? null;

    statusbar.textContent = message;

    statusbar.style.visibility = "visible";

    setTimeout(() => {
        statusbar.style.visibility = "hidden";
    }, 3000);

}
