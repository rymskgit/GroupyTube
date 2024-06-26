
function createGroupNameRow(groupname = "") {

    const groupRow = document.createElement("tr");

    // group name
    const groupArea = document.createElement("td");
    const groupNameText = document.createElement("span");
    groupNameText.classList.add("group-name");
    groupNameText.classList.add("font-class");
    groupNameText.setAttribute("id", "group-name");
    groupNameText.textContent = groupname;
    groupArea.appendChild(groupNameText);

    // remove
    const removeArea = createRemoveElement(onRemoveGroupNameClick);

    // order
    const orderArea = createOrderUpDownElement();

    groupRow.appendChild(groupArea);
    groupRow.appendChild(orderArea);
    groupRow.appendChild(removeArea);

    return groupRow;
}

function applyGroupNames(groups) {

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

function onRemoveGroupNameClick(event) {

    const rowElement = event.target.parentNode.parentNode;
    RemoveTableRow(rowElement);

    const group = rowElement.querySelector('#group-name') ?? null;
    updateStatusBar(`complete for group ${group?.value} delete.`);
}

function onReloadGroupNameClick() {
    applyGroupNames(lastsaveGroups);
}

function onAddGroupNameClick() {

    chrome.runtime.sendMessage({ type: "input-group-name" });
}

function onInputGroupName(groupname) {

    if (groupname === "") {
        return;
    }

    const groupNameTbl = document.querySelector('#group-name-table tbody') ?? null;
    if (groupNameTbl === null) {
        return
    }

    const groupRow = createGroupNameRow(groupname);

    groupNameTbl.appendChild(groupRow);
}

function createJsonGroupName() {

    const query = document.querySelectorAll('#group-name-table tbody #group-name') ?? null;
    const groupNameList = Array.from(query);

    const values = [];
    let order = 1;
    groupNameList.forEach((element) => {
        if (element.textContent !== "") {
            values.push({ name: element.textContent, order: order });
            order++;
        }
    });

    return values;
}

function onSaveGroupNameClick() {

    try {
        const groups = createJsonGroupName();

        chrome.storage.local.set({ groups: groups }, () => {
            lastsaveGroups = groups;
            updateGroupSelectorAll(groups);

            updateStatusBar(`complete for group names save.`)
        });
    } catch (error) {
        updateStatusBar(`group names save failed.`)
        console.log("group names save failed", error);
    }
}

function onExportGroupNameClick() {

    const values = createJsonGroupName();

    chrome.runtime.sendMessage({ type: "export", data: JSON.stringify(values) });
}

function onImportGroupNameClick() {

    chrome.runtime.sendMessage({ type: "import", dataType: "group-name" });
}

function importGroup(groups) {

    applyGroupNames(groups);
    onSaveGroupNameClick();
    updateStatusBar(`complete for group names import.`);
}

function onMessageGroup(message) {

    if (message.type === "import-group") {
        const groups = Array.from(message.data);
        importGroup(groups);
    }
    else if (message.type === "input-ok" && message.dataType === "group-name") {
        onInputGroupName(message.data)
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => onMessageGroup(message));
