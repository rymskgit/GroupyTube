// create groupname table row
function createGroupNameRow(groupname = "") {

    const groupRow = document.createElement("tr");

    // group name
    const groupArea = document.createElement("td");
    const groupNameText = document.createElement("input");
    groupNameText.classList.add("group-name");
    groupNameText.setAttribute("type", "text");
    groupNameText.setAttribute("id", "group-name");
    groupNameText.setAttribute("placeholder", "groupname");
    groupNameText.value = groupname;
    groupArea.appendChild(groupNameText);

    // remove
    const removeArea = document.createElement("td");
    const removeImg = document.createElement("img");
    removeImg.classList.add("remove-img");
    removeImg.rowElement = groupRow;
    removeImg.setAttribute("src", trashUrl);
    removeImg.setAttribute("title", "remove group");
    removeImg.addEventListener("click", (event) => {
        onRemoveGroupNameClick(removeImg);
    });
    removeArea.appendChild(removeImg);

    // order
    const orderArea = document.createElement("td");
    orderArea.classList.add("order-area");
    const orderUpBox = document.createElement("button");
    const orderDownBox = document.createElement("button");
    orderUpBox.classList.add("font-class");
    orderUpBox.classList.add("order-button");
    orderDownBox.classList.add("font-class");
    orderDownBox.classList.add("order-button");
    orderUpBox.textContent = "▲";
    orderDownBox.textContent = "▼";

    orderUpBox.addEventListener("click", (event) => {
        const row = event.target.parentNode.parentNode;

        if (row.previousSibling == null || row.previousSibling.nodeName.toLowerCase() !== "tr") {
            return;
        }

        row.parentNode.insertBefore(row, row.previousSibling);
    });

    orderDownBox.addEventListener("click", (event) => {
        const row = event.target.parentNode.parentNode;

        if (row.nextSibling == null || row.nextSibling.nodeName.toLowerCase() !== "tr") {
            return;
        }

        row.parentNode.insertBefore(row.nextSibling, row);
    });
    orderArea.appendChild(orderUpBox);
    orderArea.appendChild(orderDownBox);

    groupRow.appendChild(groupArea);
    groupRow.appendChild(orderArea);
    groupRow.appendChild(removeArea);

    return groupRow;
}

// update group names table
function updateGroupNamesTable(groups) {

    const groupNameTbl = document.querySelector('#group-name-table tbody') ?? null;
    if (groupNameTbl === null) {
        return;
    }

    // onece all remove
    while (groupNameTbl.childNodes.length > 0) {
        groupNameTbl.removeChild(groupNameTbl.childNodes[groupNameTbl.childNodes.length - 1]);
    }

    const sortedGroup = groups.sort((a, b) => a.order - b.order);

    sortedGroup.forEach((group) => {
        const groupRow = createGroupNameRow(group.name);
        groupNameTbl.appendChild(groupRow);
    });
}

// realod last save for group name
function onReloadGroupNameClick() {
    updateGroupNamesTable(lastsaveGroups);
}

// add group name for group name table button click
function onAddGroupNameClick() {

    const groupNameTbl = document.querySelector('#group-name-table tbody') ?? null;
    if (groupNameTbl === null) {
        return
    }

    const groupRow = createGroupNameRow();

    groupNameTbl.appendChild(groupRow);
}

function onRemoveGroupNameClick(element) {
    const parent = element.rowElement.parentNode;
    if (parent !== null) {
        parent.removeChild(element.rowElement);
    }

    const group = element.rowElement.querySelector('#group-name');
    updateStatusBar(`complete for group ${group.value} delete.`)
}

// create json for group names
function createJsonGroupName() {
    const query = document.querySelectorAll('#group-name-table tbody #group-name') ?? null;
    const groupNameList = Array.from(query);

    const values = [];
    let order = 1;
    groupNameList.forEach((element) => {
        if (element.value !== "") {
            values.push({ name: element.value, order: order });
            order++;
        }
    });

    return values;
}

// save group list button click event handler
function onSaveGroupNameClick() {

    const groups = createJsonGroupName();

    // save to chrome storage for group names
    chrome.storage.local.set({ groups: groups }, () => {
        lastsaveGroups = groups;
        updateGroupSelectorAll(groups);

        updateStatusBar(`complete for group names save.`)
    });
}

// export group names
function onExportGroupNameClick() {

    const frame = document.querySelector('#subpopup-overlay') ?? null;
    if (frame === null) {
        return;
    }

    const values = createJsonGroupName();

    chrome.runtime.sendMessage({ type: "export", data: JSON.stringify(values) });

    frame.style.display = "unset";
}

// import group names
async function onImportGroupNameClick() {

    const frame = document.querySelector('#subpopup-overlay') ?? null;
    if (frame === null) {
        return;
    }

    const subDocument = getSubPopupDocument();

    const jsonText = subDocument.querySelector('#jsonText') ?? null;
    if (jsonText === null) {
        return;
    }

    jsonText.value = "";
    jsonText.dataType = "group-name";

    frame.style.display = "unset";
}

// recieve message from subpopup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "import-group") {
        const groups = Array.from(message.data);
        updateGroupNamesTable(groups);
        onSaveGroupNameClick();
        updateStatusBar(`complete for group names import.`);
    }

});