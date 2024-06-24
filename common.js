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

function ShowSubPopup() {

    const frame = document.querySelector('#subpopup-overlay') ?? null;
    if (frame === null) {
        return;
    }

    frame.style.display = "unset";
}

function CloseSubPopup() {

    const parentDocument = window.parent.document;

    const frame = parentDocument.querySelector('#subpopup-overlay') ?? null;
    if (frame === null) {
        return;
    }

    frame.style.display = "none";
}

function updateStatusBar(message) {

    const statusbar = document.querySelector('#status-bar') ?? null;

    statusbar.textContent = message;

    statusbar.style.visibility = "visible";

    setTimeout(() => {
        statusbar.style.visibility = "hidden";
    }, 3000);

}
