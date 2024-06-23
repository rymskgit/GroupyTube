// function escape(text) {
//     return text.replace(/&/g, '&amp;')
//         .replace(/</g, '&lt;')
//         .replace(/>/g, '&gt;')
//         .replace(/"/g, '&quot;')
// }

const trashUrl = chrome.runtime.getURL("images/trash.png");

let subscriptionChannels = [];
let lastsaveGroups = [];
let lastsaveSettings = [];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// create grouping table row
function createChannelRow(channel) {

    const channelRow = document.createElement("tr");
    channelRow.setAttribute("id", "channel-row");

    // channel title
    const channelTitle = document.createElement("td");
    channelTitle.classList.add("channel-title");
    channelTitle.innerText = channel.title;

    // channel account
    const accountName = document.createElement("td");
    accountName.classList.add("channel-account");
    accountName.setAttribute("id", "channel-account");

    accountName.innerText = channel.account;

    // group selector
    const groupName = document.createElement("td");
    const groupSelector = document.createElement("select");
    groupSelector.account = channel.account;
    groupSelector.setAttribute("id", "group-select");
    groupSelector.classList.add("font-class");
    groupName.appendChild(groupSelector);


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


    // remove
    const removeArea = document.createElement("td");
    const removeImg = document.createElement("img");
    removeImg.classList.add("remove-img");
    removeImg.rowElement = channelRow;
    removeImg.setAttribute("src", trashUrl);
    removeImg.setAttribute("title", "remove");
    removeImg.addEventListener("click", (event) => {
        onRemoveGroupingClick(removeImg);
    });
    removeArea.appendChild(removeImg);


    channelRow.appendChild(channelTitle);
    channelRow.appendChild(accountName);
    channelRow.appendChild(groupName);
    channelRow.appendChild(orderArea);
    channelRow.appendChild(removeArea);

    return channelRow;
}

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

// update group selector on channel table
function updateGroupSelector(groupSelector, groups) {

    const currentValue = groupSelector.value;

    // once all remove
    while (groupSelector.options.length > 0) {
        groupSelector.options[groupSelector.options.length - 1].remove();
    }

    // create empty option
    const empty = new Option("");
    groupSelector.appendChild(empty);

    // create option elements for group
    groups.forEach((group) => {
        const option = new Option(group.name);
        groupSelector.appendChild(option);

        /* current value restore */
        if (currentValue == option.value) {
            groupSelector.value = option.value;
        }
    });
}

// update all group selector on grouping table
function updateGroupSelectorAll(groups) {

    const query = document.querySelectorAll('#grouping-table tbody #group-select') ?? null;
    const groupSelectors = Array.from(query);

    // update group selectors on channel table 
    groupSelectors.forEach((selector) => {
        updateGroupSelector(selector, groups)
    });
}

// update grouping table
function updateGroupingTable(settings = null) {

    const channelGrpTbl = document.querySelector('#grouping-table tbody') ?? null;
    if (channelGrpTbl === null) {
        return;
    }

    // if never saved it
    if (settings === null) {
        subscriptionChannels.forEach((channnel) => {
            const channelRow = createChannelRow(channnel);
            channelGrpTbl.appendChild(channelRow);
        });
        return;
    }

    // onece all remove
    while (channelGrpTbl.childNodes.length > 0) {
        channelGrpTbl.removeChild(channelGrpTbl.childNodes[channelGrpTbl.childNodes.length - 1]);
    }

    const groups = lastsaveGroups;

    // if exists in channels, get in settings 
    const channelSettings = subscriptionChannels.map((channel) => {
        const setting = settings.find((value) => value.account == channel.account) ?? null;
        if (setting === null) {
            return { title: channel.title, account: channel.account, group: { name: "", order: 0 }, order: 0 };
        }
        const group = groups.find((value) => value.name === setting.groupname) ?? null;
        if (group !== null) {
            return { title: channel.title, account: channel.account, group: { name: setting.groupname, order: group.order }, order: setting.order };
        }
        else {
            return { title: channel.title, account: channel.account, group: { name: setting.groupname, order: 0 }, order: setting.order };
        }
    });

    // if exists in settings and not exists in subscription_channels, add in channelSettings
    settings.forEach((setting) => {
        const channel = subscriptionChannels.find((channel) => channel.account === setting.account) ?? null;
        if (channel === null) {
            const group = groups.find((value) => value.name === setting.groupname) ?? null;
            if (group !== null) {
                channelSettings.push({ title: "", account: setting.account, group: { name: setting.groupname, order: group.order }, order: setting.order });
            }
            else {
                channelSettings.push({ title: "", account: setting.account, group: { name: setting.groupname, order: 0 }, order: setting.order });
            }
        }
    });

    // sort by group order and set on grouping table and update group selector
    channelSettings.sort((a, b) => {
        if (a.group.order === b.group.order) {
            return a.order - b.order
        }
        else if (a.group.order < b.group.order) {
            return -1;
        }
        return 1;
    }).forEach((value) => {
        const channelRow = createChannelRow({ title: value.title, account: value.account });
        channelGrpTbl.appendChild(channelRow);

        const groupSelector = channelRow.querySelector('#group-select') ?? null;
        if (groupSelector !== null) {
            updateGroupSelector(groupSelector, groups);
            groupSelector.value = value.group.name;
        }
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

    const subpopup = frame.querySelector("#subpopup") ?? null;
    if (subpopup === null) {
        return;
    }

    const subDocument = subpopup.contentWindow.document;
    const jsonText = subDocument.querySelector('#jsonText') ?? null;
    if (jsonText === null) {
        return;
    }

    const values = createJsonGroupName();
    jsonText.value = JSON.stringify(values);

    frame.dataType = "group-name";
    frame.style.display = "unset";
}

// import group names
async function onImportGroupNameClick() {

    const frame = document.querySelector('#subpopup-overlay') ?? null;
    if (frame === null) {
        return;
    }

    const subpopup = frame.querySelector("#subpopup") ?? null;
    if (subpopup === null) {
        return;
    }

    const subDocument = subpopup.contentWindow.document;
    const jsonText = subDocument.querySelector('#jsonText') ?? null;
    if (jsonText === null) {
        return;
    }

    jsonText.value = "";

    frame.dataType = "group-name";
    frame.style.display = "unset";
}

// reload last save for grouping
function onReloadGroupingClick() {

    updateGroupingTable(lastsaveSettings);

    updateStatusBar(`complete for grouping reload.`)
}

// remove grouping
function onRemoveGroupingClick(element) {
    const parent = element.rowElement.parentNode;
    if (parent !== null) {
        parent.removeChild(element.rowElement);
    }

    updateStatusBar(`complete for  grouping delete.`)
}

// create json grouping
function createJsonGrouping() {
    const query = document.querySelectorAll('#grouping-table tbody #channel-row') ?? null;
    const channels = Array.from(query)
    const groups = lastsaveGroups;

    const settings = [];
    let order = 1;
    channels.forEach((channel) => {
        const queryAccount = channel.querySelector('#channel-account');
        const queryGroup = channel.querySelector('#group-select');

        if (queryAccount !== null && queryGroup !== null) {
            const account = queryAccount.innerText;
            const groupName = queryGroup.value;

            settings.push({ account: account, groupname: groupName, order: order });
            order++;
        }
    });

    return settings;
}

// save grouping button click event handler
function onSaveGroupingClick() {

    const settings = createJsonGrouping();

    // save to chrome storage for grouping
    chrome.storage.local.set({ settings: settings }, () => {
        lastsaveSettings = settings;

        updateStatusBar(`complete for grouping save.`);
    });
}

function getSubPopupDocument() {

    const frame = document.querySelector('#subpopup-overlay') ?? null;
    if (frame === null) {
        return;
    }

    const subpopup = frame.querySelector("#subpopup") ?? null;
    if (subpopup === null) {
        return;
    }

    const subDocument = subpopup.contentWindow.document;

    return subDocument;
}

// export grouping
function onExportGroupingClick() {

    const subDocument = getSubPopupDocument();

    const jsonText = subDocument.querySelector('#jsonText') ?? null;
    if (jsonText === null) {
        return;
    }

    const settings = createJsonGrouping();
    jsonText.value = JSON.stringify(settings);

    frame.dataType = "grouping";
    frame.style.display = "unset";
}

// import grouping
function onImportGroupingClick() {

    const subDocument = getSubPopupDocument();

    const jsonText = subDocument.querySelector('#jsonText') ?? null;
    if (jsonText === null) {
        return;
    }

    jsonText.value = "";

    frame.dataType = "grouping";
    frame.style.display = "unset";
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// load subcscription channel from storage
async function loadSubcriptionChannelsFromStorage() {

    const data = await chrome.storage.local.get("channels");

    if (data.channels === undefined || data.channels === null) {
        return;
    }

    subscriptionChannels = Array.from(data.channels);
}

// load group name from storage
async function loadGroupsFromStorage() {

    const data = await chrome.storage.local.get("groups");

    if (data.groups === undefined || data.groups === null) {
        return;
    }

    lastsaveGroups = Array.from(data.groups);
}

// load setting for grouping from storage
async function loadSettingsFromStorage() {

    const data = await chrome.storage.local.get("settings");

    if (data.settings === undefined || data.settings === null) {
        return;
    }

    lastsaveSettings = Array.from(data.settings);
}

// get config from storage
async function loadConfig() {

    await loadSubcriptionChannelsFromStorage();

    await loadGroupsFromStorage();

    await loadSettingsFromStorage();
}

// recieve message from subpopup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "import-group") {
        const groups = Array.from(message.data);
        updateGroupNamesTable(groups);
        onSaveGroupNameClick();
        updateStatusBar(`complete for group names import.`);
    }
    else if (message.type === "import-grouping") {
        const settings = Array.from(message.data);
        updateGroupingTable(settings);
        onSaveGroupingClick();
        updateStatusBar(`complete for grouping import.`);
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// update status bar
function updateStatusBar(message) {

    const statusbar = document.querySelector('#status-bar') ?? null;

    statusbar.textContent = message;

    statusbar.style.visibility = "visible";

    setTimeout(() => {
        statusbar.style.visibility = "hidden";
    }, 3000);

}

// main process
async function main() {

    await loadConfig();

    updateGroupNamesTable(lastsaveGroups);

    updateGroupingTable(lastsaveSettings);

    const reloadGroupNameBtn = document.querySelector('#reload-group-name') ?? null;
    if (reloadGroupNameBtn !== null) {
        reloadGroupNameBtn.addEventListener('click', (event) => {
            onReloadGroupNameClick();
        });
    }

    const addGroupNameBtn = document.querySelector('#add-group-name') ?? null;
    if (addGroupNameBtn !== null) {
        addGroupNameBtn.addEventListener('click', (event) => {
            onAddGroupNameClick();
        });
    }

    const saveGroupNameBtn = document.querySelector('#save-group-name') ?? null;
    if (saveGroupNameBtn !== null) {
        saveGroupNameBtn.addEventListener('click', (event) => {
            onSaveGroupNameClick();
        });
    }

    const exportGroupNameBtn = document.querySelector('#export-group-name') ?? null;
    if (exportGroupNameBtn !== null) {
        exportGroupNameBtn.addEventListener('click', (event) => {
            onExportGroupNameClick();
        });
    }

    const importGroupNameBtn = document.querySelector('#import-group-name') ?? null;
    if (importGroupNameBtn !== null) {
        importGroupNameBtn.addEventListener('click', (event) => {
            onImportGroupNameClick();
        });
    }

    const reloadGroupingBtn = document.querySelector('#reload-grouping') ?? null;
    if (reloadGroupingBtn !== null) {
        reloadGroupingBtn.addEventListener('click', (event) => {
            onReloadGroupingClick();
        });
    }

    const saveGroupingBtn = document.querySelector('#save-grouping') ?? null;
    if (saveGroupingBtn !== null) {
        saveGroupingBtn.addEventListener('click', (event) => {
            onSaveGroupingClick();
        });
    }

    const exportGroupingBtn = document.querySelector('#export-grouping') ?? null;
    if (exportGroupingBtn !== null) {
        exportGroupingBtn.addEventListener('click', (event) => {
            onExportGroupingClick();
        });
    }

    const importGroupingBtn = document.querySelector('#import-grouping') ?? null;
    if (importGroupingBtn !== null) {
        importGroupingBtn.addEventListener('click', (event) => {
            onImportGroupingClick();
        });
    }
}

window.onload = async () => {
    await main();
}
