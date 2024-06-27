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

        if (element.edit === false) {
            chrome.runtime.sendMessage({ type: "input-ok", dataType: element.dataType, data: element.value });
        }
        else if (element.edit === true) {
            chrome.runtime.sendMessage({ type: "edit-ok", dataType: element.dataType, data: { newValue: element.value, oldValue: element.oldvalue } });
        }
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

function onInputGroupName(groupname = "", edit = false) {

    const inputLabel = document.querySelector('#input-lable') ?? null;
    if (inputLabel === null) {
        return;
    }
    inputLabel.textContent = "Group Name :"

    const element = document.querySelector('input[type="text"]') ?? null;
    if (element === null) {
        return;
    }

    element.oldvalue = groupname;
    element.value = groupname;
    element.dataType = "group-name";
    element.edit = edit;

    Show();
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

    if (message.type === "input-group-name") {
        onInputGroupName();
    }
    else if (message.type === "edit-group-name") {
        onInputGroupName(message.data, true);
    }
});

function main() {
    setEventHandler();
}

window.onload = () => {
    main();
}
