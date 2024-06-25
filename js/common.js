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

function RemoveTableRow(rowElement) {
    const parent = rowElement.parentNode;
    if (parent !== null) {
        parent.removeChild(rowElement);
    }
}

function MoveUpTableRow(rowElement) {
    if (rowElement.previousSibling == null || rowElement.previousSibling.nodeName.toLowerCase() !== "tr") {
        return;
    }

    rowElement.parentNode.insertBefore(rowElement, rowElement.previousSibling);
}

function MoveDownTableRow(rowElement) {
    if (rowElement.nextSibling == null || rowElement.nextSibling.nodeName.toLowerCase() !== "tr") {
        return;
    }

    rowElement.parentNode.insertBefore(rowElement.nextSibling, rowElement);
}

function createOrderUpDownElement() {

    const orderElement = document.createElement("td");
    orderElement.classList.add("order-area");

    const orderUpBox = document.createElement("button");
    orderUpBox.classList.add("font-class");
    orderUpBox.classList.add("order-button");
    orderUpBox.textContent = "▲";
    orderUpBox.addEventListener("click", (event) => MoveUpTableRow(event.target.parentNode.parentNode));

    const orderDownBox = document.createElement("button");
    orderDownBox.classList.add("font-class");
    orderDownBox.classList.add("order-button");
    orderDownBox.textContent = "▼";
    orderDownBox.addEventListener("click", (event) => MoveDownTableRow(event.target.parentNode.parentNode));

    orderElement.appendChild(orderUpBox);
    orderElement.appendChild(orderDownBox);

    return orderElement;
}

function createRemoveElement(clickEventHandler) {

    const removeElement = document.createElement("td");
    const removeImg = document.createElement("img");
    removeImg.classList.add("remove-img");
    removeImg.setAttribute("src", trashUrl);
    removeImg.setAttribute("title", "remove");
    removeImg.addEventListener("click", (event) => clickEventHandler(event));
    removeElement.appendChild(removeImg);

    return removeElement;
}

function updateStatusBar(message) {

    const statusbar = document.querySelector('#status-bar') ?? null;

    statusbar.textContent = message;

    statusbar.style.visibility = "visible";

    setTimeout(() => {
        statusbar.style.visibility = "hidden";
    }, 3000);

}
