
function showInputBox() {

    const parentDocument = window.parent.document;

    const frame = parentDocument.querySelector('#inputbox-overlay') ?? null;
    if (frame === null) {
        return;
    }

    frame.style.display = "unset";
}

function closeInputBox() {

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
        if (element.edit === false) {
            chrome.runtime.sendMessage({ type: "input-ok", dataType: element.dataType, data: element.value });
        }
        else if (element.edit === true) {
            chrome.runtime.sendMessage({ type: "edit-ok", dataType: element.dataType, data: { newValue: element.value.substring(0, 16), oldValue: element.oldvalue } });
        }
    }

    closeInputBox();
}

function onCancelClick() {

    const element = document.querySelector('input[type="text"]') ?? null;

    if (element !== null) {
        chrome.runtime.sendMessage({ type: "input-cancel", dataType: element.dataType });
    }

    closeInputBox();
}

function setLabel(dataType) {

    const inputLabel = document.querySelector('#input-lable') ?? null;
    if (inputLabel === null) {
        return;
    }

    if (dataType === "group-name") {
        inputLabel.textContent = "Group Name :";
    }
    else {
        inputLabel.textContent = "Value :";
    }
}

function onInput(dataType, value = "", edit = false) {

    const element = document.querySelector('input[type="text"]') ?? null;
    if (element === null) {
        return;
    }

    element.dataType = dataType;
    element.oldvalue = value;
    element.value = value;
    element.edit = edit;

    setLabel(dataType);
    showInputBox();
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
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "input") {
        onInput(message.dataType);
    }
    else if (message.type === "edit") {
        onInput(message.dataType, message.data, true);
    }
});

function main() {
    setEventHandler();
}

window.onload = () => {
    main();
}
