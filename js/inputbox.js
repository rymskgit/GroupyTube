function Show() {

    const parentDocument = window.parent.document;

    const frame = parentDocument.querySelector('#inputbox-overlay') ?? null;
    if (frame === null) {
        return;
    }

    frame.style.display = "unset";
}

function Close() {

    const parentDocument = window.parent.document;

    const frame = parentDocument.querySelector('#inputbox-overlay') ?? null;
    if (frame === null) {
        return;
    }

    frame.style.display = "none";
}

function onOkClick() {

    const element = document.querySelector('input[type="text"]') ?? null;

    if (element !== null) {
        chrome.runtime.sendMessage({ type: "input-ok", dataType: element.dataType, data: element.value });
    }

    Close();
}

function onCancelClick() {

    const element = document.querySelector('input[type="text"]') ?? null;

    if (element !== null) {
        chrome.runtime.sendMessage({ type: "input-cancel", dataType: element.dataType });
    }

    Close();
}

function onInputGroupName() {

    const inputLabel = document.querySelector('#input-lable') ?? null;
    if (inputLabel === null) {
        return;
    }
    inputLabel.textContent = "Group Name :"

    const element = document.querySelector('input[type="text"]') ?? null;
    if (element === null) {
        return;
    }
    element.dataType = "group-name";

    Show();
}

function onMessageInputBox(message) {

    if (message.type === "input-group-name") {
        onInputGroupName();
    }
}

function setEventHandler() {

    const okBtn = document.querySelector('#ok') ?? null;
    if (okBtn !== null) {
        okBtn.addEventListener("click", (event) => onOkClick());
    }

    const cancelBtn = document.querySelector('#cancel') ?? null;
    if (cancelBtn !== null) {
        cancelBtn.addEventListener("click", (event) => onCancelClick());
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => onMessageInputBox(message));
}

function main() {
    setEventHandler();
}

window.onload = () => {
    main();
}
