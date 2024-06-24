
function createChannelRow(channel) {

    const channelRow = document.createElement("tr");
    channelRow.setAttribute("id", "channel-row");

    // channel title
    const channelTitle = document.createElement("td");
    channelTitle.classList.add("channel-title");
    channelTitle.classList.add("font-class");
    channelTitle.innerText = channel.title;

    // channel account
    const accountName = document.createElement("td");
    accountName.classList.add("channel-account");
    accountName.classList.add("font-class");
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

function updateGroupSelector(groupSelector, groups) {

    const currentValue = groupSelector.value;

    // once all remove
    while (groupSelector.options.length > 0) {
        groupSelector.options[groupSelector.options.length - 1].remove();
    }

    const empty = new Option("");
    groupSelector.appendChild(empty);

    groups.forEach((group) => {
        const option = new Option(group.name);
        groupSelector.appendChild(option);

        if (currentValue == option.value) {
            groupSelector.value = option.value;
        }
    });
}

function updateGroupSelectorAll(groups) {

    const query = document.querySelectorAll('#grouping-table tbody #group-select') ?? null;
    const groupSelectors = Array.from(query);

    groupSelectors.forEach((selector) => {
        updateGroupSelector(selector, groups)
    });
}

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

function onRemoveGroupingClick(element) {
    const parent = element.rowElement.parentNode;
    if (parent !== null) {
        parent.removeChild(element.rowElement);
    }

    updateStatusBar(`complete for  grouping delete.`)
}

function onReloadGroupingClick() {

    updateGroupingTable(lastsaveSettings);

    updateStatusBar(`complete for grouping reload.`)
}

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

function onSaveGroupingClick() {

    try {
        const settings = createJsonGrouping();

        chrome.storage.local.set({ settings: settings }, () => {
            lastsaveSettings = settings;

            updateStatusBar(`complete for grouping save.`);
        });
    }
    catch (error) {
        updateStatusBar(`grouping save failed.`);
        console.log("grouping save failed", error);
    }
}

function onExportGroupingClick() {

    const settings = createJsonGrouping();

    chrome.runtime.sendMessage({ type: "export", data: JSON.stringify(settings) });

    ShowSubPopup();
}

function onImportGroupingClick() {

    chrome.runtime.sendMessage({ type: "import", dataType: "grouping" });

    ShowSubPopup();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "import-grouping") {
        const settings = Array.from(message.data);
        updateGroupingTable(settings);
        onSaveGroupingClick();
        updateStatusBar(`complete for grouping import.`);
    }
});
