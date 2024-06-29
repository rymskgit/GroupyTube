
function createGroupNameRow(groupname = "") {

    const groupRow = document.createElement("tr");
    groupRow.setAttribute("id", "group-name-row")

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
    editImg.addEventListener("click", (event) => onEditGroupNameClick(event));
    groupName.appendChild(editImg);
    groupArea.appendChild(groupName);

    // order
    const orderArea = createOrderUpDownElement();

    // remove
    const removeArea = createRemoveElement(onRemoveGroupNameClick);

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

function onEditGroupNameClick(event) {

    const rowElement = event.target.parentNode.parentNode;

    const group = rowElement.querySelector('#group-name') ?? null;
    if (group === null) {
        return;
    }

    chrome.runtime.sendMessage({ type: "edit-group-name", data: group.textContent });
}

function onEditGroupName(data) {

    const query = document.querySelectorAll('#group-name-table tbody #group-name');
    const elements = Array.from(query);

    const value = elements.find((element) => element.textContent === data.oldValue);

    if (value !== null) {
        value.textContent = data.newValue;
    }

    updateGroupItem(data.newValue, data.oldValue);
}

function onRemoveGroupNameClick(event) {

    const rowElement = event.target.parentNode.parentNode;
    RemoveTableRow(rowElement);

    const group = rowElement.querySelector('#group-name') ?? null;
    updateStatusBar(`complete for group ${group?.textContent} delete.`);
}

function onReloadGroupNameClick() {

    applyGroupNames(lastsaveGroups);
}

function onAddGroupNameClick() {

    chrome.runtime.sendMessage({ type: "input-group-name" });
}

function validateGroupName(groupname) {

    const query = document.querySelectorAll('#group-name-table tbody #group-name');
    const elements = Array.from(query);

    const value = elements.find((element) => element.textContent === groupname) ?? null;

    return value === null;
}

function onInputGroupName(groupname) {

    if (groupname === "") {
        return;
    }

    if (validateGroupName(groupname) === false) {
        updateStatusBar("invalid group name.");
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

function onSaveGroupNameClick() {

    try {
        const groups = createJsonGroupName();

        chrome.storage.local.set({ groups: groups }, () => {
            lastsaveGroups = groups;
            applyGroupItemsAll(groups);

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "import-group") {
        const groups = Array.from(message.data);
        importGroup(groups);
    }
    else if (message.type === "input-ok" && message.dataType === "group-name") {
        onInputGroupName(message.data)
    }
    else if (message.type === "edit-ok" && message.dataType === "group-name") {
        onEditGroupName(message.data);
    }
});
