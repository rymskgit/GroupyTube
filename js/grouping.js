
function createChannelRow(channel) {

    const channelRow = document.createElement("tr");
    channelRow.setAttribute("id", "channel-row");

    // channel title
    const channelTitle = document.createElement("td");
    channelTitle.classList.add("font-class");
    channelTitle.classList.add("channel-title");
    channelTitle.innerText = channel.title;

    // channel account
    const accountName = document.createElement("td");
    accountName.classList.add("font-class");
    accountName.classList.add("channel-account");
    accountName.setAttribute("id", "channel-account");
    accountName.innerText = channel.account;

    // group selector
    const groupName = document.createElement("td");
    const groupSelector = document.createElement("select");
    groupSelector.account = channel.account;
    groupSelector.classList.add("font-class");
    groupSelector.classList.add("group");
    groupSelector.setAttribute("id", "group-select");
    groupName.appendChild(groupSelector);

    // order
    const orderArea = createOrderUpDownElement();

    // remove
    const removeArea = createRemoveElement(onRemoveGroupingClick);

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

function mergeSettings(settings) {

    const groups = lastsaveGroups;

    let channelSettings = [];
    settings.forEach((setting) => {
        const channel = subscriptionChannels.find((channel) => channel.account === setting.account) ?? null;
        const group = groups.find((value) => value.name === setting.groupname) ?? null;
        let order = 0;
        if (group !== null) {
            order = group.order;
        }

        // case where in settings and subscriotion
        if (channel !== null) {
            channelSettings.push({ title: channel.title, account: setting.account, group: { name: setting.groupname, order: order }, order: setting.order });
        }
        // case where only in settings
        else if (channel === null) {
            channelSettings.push({ title: "", account: setting.account, group: { name: setting.groupname, order: order }, order: setting.order });
        }
    });

    subscriptionChannels.forEach((channel) => {
        const setting = settings.find((value) => value.account == channel.account) ?? null;
        // case where only in subscriotion
        if (setting === null) {
            channelSettings.push({ title: channel.title, account: channel.account, group: { name: "", order: 0 }, order: 0 });
        }
    });

    channelSettings = channelSettings.sort((a, b) => {
        if (a.group.order === b.group.order) {
            return a.order - b.order
        }
        else if (a.group.order < b.group.order) {
            return -1;
        }
        return 1;
    });

    return channelSettings;
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
    const channelSettings = mergeSettings(settings);

    // sort by group order and set on grouping table and update group selector
    channelSettings.forEach((value) => {
        const channelRow = createChannelRow({ title: value.title, account: value.account });
        channelGrpTbl.appendChild(channelRow);

        const groupSelector = channelRow.querySelector('#group-select') ?? null;
        if (groupSelector !== null) {
            updateGroupSelector(groupSelector, groups);
            groupSelector.value = value.group.name;
        }
    });
}

function onRemoveGroupingClick(event) {

    RemoveTableRow(event.target.parentNode.parentNode);
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
}

function onImportGroupingClick() {

    chrome.runtime.sendMessage({ type: "import", dataType: "grouping" });
}

function importGrouping(settings) {

    updateGroupingTable(settings);
    onSaveGroupingClick();
    updateStatusBar(`complete for grouping import.`);
}

function onMessage(message) {

    if (message.type === "import-grouping") {
        const settings = Array.from(message.data);
        importGrouping(settings);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => onMessage(message));
