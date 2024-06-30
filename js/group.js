
function createGroupRow(groupname = "") {

    const groupRow = document.createElement("tr");
    groupRow.setAttribute("id", "group-row")

    // group name
    const groupArea = document.createElement("td");
    const groupName = document.createElement("div");
    groupName.classList.add("group-name-area");
    const groupNameText = document.createElement("span");
    groupNameText.classList.add("group-name");
    groupNameText.classList.add("font-class");
    groupNameText.setAttribute("id", "group-name");
    groupNameText.textContent = groupname;
    groupName.appendChild(groupNameText);

    // edit
    //const editArea = document.createElement("td");
    const editImg = document.createElement("img");
    editImg.classList.add("edit-img");
    editImg.setAttribute("src", editUrl);
    editImg.setAttribute("title", "edit");
    editImg.addEventListener("click", (event) => onEditGroupClick(event));
    groupName.appendChild(editImg);
    groupArea.appendChild(groupName);

    // order
    const orderArea = createOrderUpDownElement();

    // remove
    const removeArea = createRemoveElement(onRemoveGroupClick);

    groupRow.appendChild(groupArea);
    groupRow.appendChild(orderArea);
    groupRow.appendChild(removeArea);

    return groupRow;
}

function createJsonGroups() {

    const query = document.querySelectorAll('#groups-table tbody #group-name') ?? null;
    const elements = Array.from(query);

    const values = [];
    let order = 1;
    elements.forEach((element) => {
        if (element.textContent !== "") {
            values.push({ name: element.textContent, order: order });
            order++;
        }
    });

    return values;
}

function validateGroup(groupname) {

    const query = document.querySelectorAll('#groups-table tbody #group-name');
    const elements = Array.from(query);

    const value = elements.find((element) => element.textContent === groupname) ?? null;

    return value === null;
}


function applyGroups(groups) {

    const groupsTbl = document.querySelector('#groups-table tbody') ?? null;
    if (groupsTbl === null) {
        return;
    }

    // onece all remove
    while (groupsTbl.childNodes.length > 0) {
        groupsTbl.removeChild(groupsTbl.childNodes[groupsTbl.childNodes.length - 1]);
    }

    const sortedGroup = groups.sort((a, b) => a.order - b.order);

    sortedGroup.forEach((group) => {
        const groupRow = createGroupRow(group.name);
        groupsTbl.appendChild(groupRow);
    });
}

function onEditGroupClick(event) {

    const rowElement = event.target.parentNode.parentNode;

    const group = rowElement.querySelector('#group-name') ?? null;
    if (group === null) {
        return;
    }

    chrome.runtime.sendMessage({ type: "edit", dataType: "group-name", data: group.textContent });
}

function onRemoveGroupClick(event) {

    const rowElement = event.target.parentNode.parentNode;
    RemoveTableRow(rowElement);

    const group = rowElement.querySelector('#group-name') ?? null;
    updateStatusBar(`complete for group ${group?.textContent} delete.`);
}

function onReloadGroupClick() {

    applyGroups(lastsaveGroups);
}

function onAddGroupClick() {

    chrome.runtime.sendMessage({ type: "input", dataType: "group-name" });
}

function onSaveGroupClick() {

    try {
        const groups = createJsonGroups();

        chrome.storage.local.set({ groups: groups }, () => {
            lastsaveGroups = groups;
            applyGroupItemsAll(groups);

            updateStatusBar(`complete for groups save.`)
        });
    } catch (error) {
        updateStatusBar(`groups save failed.`)
        console.log("groups save failed", error);
    }
}

function onExportGroupsClick() {

    const values = createJsonGroups();
    chrome.runtime.sendMessage({ type: "export", data: JSON.stringify(values) });
}

function onImportGroupsClick() {

    chrome.runtime.sendMessage({ type: "import", dataType: "group-name" });
}

function editGroupName(data) {

    const query = document.querySelectorAll('#groups-table tbody #group-name');
    const elements = Array.from(query);

    const value = elements.find((element) => element.textContent === data.oldValue);

    if (value !== null) {
        value.textContent = data.newValue;
    }

    updateGroupItem(data.newValue, data.oldValue);
}

function inputGroupName(groupname) {

    if (groupname === "") {
        return;
    }

    if (validateGroup(groupname) === false) {
        updateStatusBar("invalid group name.");
        return;
    }

    const groupsTbl = document.querySelector('#groups-table tbody') ?? null;
    if (groupsTbl === null) {
        return
    }

    const groupRow = createGroupRow(groupname);

    groupsTbl.appendChild(groupRow);
}

function importGroups(groups) {

    applyGroups(groups);
    onSaveGroupClick();
    updateStatusBar(`complete for groups import.`);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "import-group") {
        const groups = Array.from(message.data);
        importGroups(groups);
    }
    else if (message.type === "input-ok" && message.dataType === "group-name") {
        inputGroupName(message.data)
    }
    else if (message.type === "edit-ok" && message.dataType === "group-name") {
        editGroupName(message.data);
    }
});
