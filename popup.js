(function () {

    // function escape(text) {
    //     return text.replace(/&/g, '&amp;')
    //         .replace(/</g, '&lt;')
    //         .replace(/>/g, '&gt;')
    //         .replace(/"/g, '&quot;')
    // }

    const trashUrl = chrome.runtime.getURL("images/trash.png");

    let subscription_channels = [];
    let lastsave_groups = [];
    let lastsave_settings = [];

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // create channel group table row
    function createChannelRow(channel) {

        const channelRow = document.createElement("tr");
        channelRow.setAttribute("id", "channel-row");

        // channel title
        const channelTitle = document.createElement("td");
        channelTitle.innerText = channel.title;
        channelRow.appendChild(channelTitle);

        // channel account
        const accountName = document.createElement("td");
        accountName.setAttribute("id", "channel-account");
        accountName.innerText = channel.account;
        channelRow.appendChild(accountName);

        // group selector
        const groupName = document.createElement("td");
        const groupSelector = document.createElement("select");
        groupSelector.account = channel.account;
        groupSelector.setAttribute("id", "group-select");
        groupSelector.classList.add("font-class");
        groupName.appendChild(groupSelector);
        channelRow.appendChild(groupName);

        // order
        const orderArea = document.createElement("td");
        orderArea.classList.add("order-col");
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

            const id = row.previousSibling.getAttribute("id");
            if (id === "channel-group-table-header") {
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
        channelRow.appendChild(orderArea);

        return channelRow;
    }

    // create groupname table row
    function createGroupNameRow(groupname = "") {

        const groupRow = document.createElement("tr");

        // group name
        const groupCol = document.createElement("td");
        const groupNameText = document.createElement("input");
        groupNameText.setAttribute("type", "text");
        groupNameText.setAttribute("id", "group-name");
        groupNameText.setAttribute("placeholder", "groupname");
        groupNameText.value = groupname;
        groupCol.appendChild(groupNameText);

        // remove
        const removeCol = document.createElement("td");
        const removeImg = document.createElement("img");
        removeImg.classList.add("remove-img");
        removeImg.rowElement = groupRow;
        removeImg.setAttribute("src", trashUrl);
        removeImg.setAttribute("title", "remove group");
        removeImg.addEventListener("click", (event) => {
            onRemoveGroupNameClick(removeImg);
        });
        removeCol.appendChild(removeImg);

        // order
        const orderCol = document.createElement("td");
        orderCol.classList.add("order-col");
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

            const id = row.previousSibling.getAttribute("id");
            if (id === "group-name-table-header") {
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
        orderCol.appendChild(orderUpBox);
        orderCol.appendChild(orderDownBox);


        //groupRow.appendChild(chkCol);
        groupRow.appendChild(groupCol);
        groupRow.appendChild(orderCol);
        groupRow.appendChild(removeCol);

        return groupRow;
    }

    // update group names table
    function updateGroupNames(groups) {

        const groupNameTbl = document.querySelector('#group-name-table tbody') ?? null;
        if (groupNameTbl === null) {
            return;
        }

        // once all remove
        while (groupNameTbl.childNodes.length > 1) {
            groupNameTbl.removeChild(groupNameTbl.childNodes[groupNameTbl.childNodes.length - 1]);
        }

        groups.forEach((group) => {
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

    // update all channel group selector on channel table
    function updateGroupSelectorAll(groups) {

        const query = document.querySelectorAll('#channel-group-table tbody #group-select') ?? null;
        const groupSelectors = Array.from(query);

        // update group selectors on channel table 
        groupSelectors.forEach((selector) => {
            updateGroupSelector(selector, groups)
        });
    }

    // update channel group table
    function updateChannelGroup(settings) {

        const channelGrpTbl = document.querySelector('#channel-group-table tbody') ?? null;
        if (channelGrpTbl === null) {
            return;
        }

        // once all remove
        while (channelGrpTbl.childNodes.length > 1) {
            channelGrpTbl.removeChild(channelGrpTbl.childNodes[channelGrpTbl.childNodes.length - 1]);
        }

        const groups = lastsave_groups;

        // if exists in channels, get in settings and sort by order
        const channelSettings = subscription_channels.map((channel) => {
            const setting = settings.find((value) => value.account == channel.account) ?? null;
            if (setting === null) {
                return { title: channel.title, account: channel.account, groupName: "", order: 0 };
            }
            return { title: channel.title, account: channel.account, groupName: setting.group.name, order: setting.order };
        }).sort((a, b) => {
            if (a.groupName === b.groupName) {
                return a.order - b.order
            }
            else if (a.groupName <= b.groupName) {
                return -1;
            }
            return 1;
        });

        // set on channel group table and update group selector
        channelSettings.forEach((value) => {
            const channelRow = createChannelRow({ title: value.title, account: value.account, group: value.groupName });
            channelGrpTbl.appendChild(channelRow);

            const groupSelector = channelRow.querySelector('#group-select') ?? null;
            if (groupSelector !== null) {
                updateGroupSelector(groupSelector, groups);
                groupSelector.value = value.groupName;
            }
        });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // realod last save for group name
    function onReloadGroupNameClick() {
        updateGroupNames(lastsave_groups);
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
        updateStatusBar(`group "${group.value}" deleted.`)
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
            lastsave_groups = groups;
            updateGroupSelectorAll(groups);

            updateStatusBar(`group names save completed.`)
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

    // reload last save for channel group
    function onReloadChannelGroupClick() {

        updateChannelGroup(lastsave_settings);

        updateStatusBar(`channel groups reload completed.`)
    }

    // create json channel group
    function createJsonChannelGroup() {
        const query = document.querySelectorAll('#channel-group-table tbody #channel-row') ?? null;
        const channels = Array.from(query)
        const groups = lastsave_groups;

        const settings = [];
        let order = 1;
        channels.forEach((channel) => {
            const queryAccount = channel.querySelector('#channel-account');
            const queryGroup = channel.querySelector('#group-select');

            if (queryAccount !== null && queryGroup !== null) {
                const account = queryAccount.innerText;
                const groupName = queryGroup.value;

                const group = groups.find((value) => value.name === groupName) ?? null;
                if (group !== null) {
                    settings.push({ account: account, group: group, order: order });
                } else {
                    settings.push({ account: account, group: { name: groupName, order: 999 }, order: order });
                }
                order++;
            }
        });

        return settings;
    }

    // save channel group button click event handler
    function onSaveChannelGroupClick() {

        const settings = createJsonChannelGroup();

        // save to chrome storage for channel group
        chrome.storage.local.set({ settings: settings }, () => {
            lastsave_settings = settings;

            updateStatusBar(`channel groups save completed.`);
        });
    }

    // export channel group
    function onExportChannelGroupClick() {

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

        const settings = createJsonChannelGroup();
        jsonText.value = JSON.stringify(settings);

        frame.dataType = "channel-group";
        frame.style.display = "unset";
    }

    // import channel group
    function onImportChannelGroupClick() {

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

        frame.dataType = "channel-group";
        frame.style.display = "unset";
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async function getFromStorage() {

        // get channel info from chrome storage
        await chrome.storage.local.get("channels", function (data) {

            if (data.channels === undefined || data.channels === null) {
                return;
            }
            subscription_channels = Array.from(data.channels);
        });

        await chrome.storage.local.get("groups", function (data) {

            if (data.groups === undefined || data.groups === null) {
                return;
            }
            const values = Array.from(data.groups);
            lastsave_groups = values;

            updateGroupNames(lastsave_groups);
        });

        chrome.storage.local.get("settings", function (data) {

            const channelGrpTbl = document.querySelector('#channel-group-table tbody') ?? null;
            if (channelGrpTbl === null) {
                return;
            }

            if (data.settings === undefined || data.settings === null) {
                subscription_channels.forEach((channnel) => {
                    const channelRow = createChannelRow(channnel);
                    channelGrpTbl.appendChild(channelRow);
                });
                return;
            }
            const settings = Array.from(data.settings);
            lastsave_settings = settings;

            updateChannelGroup(settings);
        });
    }

    // recieve message from subpopup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

        if (message.type === "import-group") {
            const groups = Array.from(message.data);
            updateGroupNames(groups);
            onSaveGroupNameClick();
            updateStatusBar(`group names import completed.`);
        }
        else if (message.type === "import-channel-group") {
            const settings = Array.from(message.data);
            updateChannelGroup(settings);
            onSaveChannelGroupClick();
            updateStatusBar(`channel groups import completed.`);
        }
    });

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // update status bar
    function updateStatusBar(message) {

        const statusbar = document.querySelector('#status-bar') ?? null;

        statusbar.textContent = message;

    }

    // main process
    function main() {

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

        const saveGroupNameBtn = document.querySelector('#save-group-list') ?? null;
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

        const reloadChannelGroupBtn = document.querySelector('#reload-channel-group') ?? null;
        if (reloadChannelGroupBtn !== null) {
            reloadChannelGroupBtn.addEventListener('click', (event) => {
                onReloadChannelGroupClick();
            });
        }

        const saveChannelGroupBtn = document.querySelector('#save-channel-group') ?? null;
        if (saveChannelGroupBtn !== null) {
            saveChannelGroupBtn.addEventListener('click', (event) => {
                onSaveChannelGroupClick();
            });
        }

        const exportChannelGroupBtn = document.querySelector('#export-channel-group') ?? null;
        if (exportChannelGroupBtn !== null) {
            exportChannelGroupBtn.addEventListener('click', (event) => {
                onExportChannelGroupClick();
            });
        }

        const importChannelGroupBtn = document.querySelector('#import-channel-group') ?? null;
        if (importChannelGroupBtn !== null) {
            importChannelGroupBtn.addEventListener('click', (event) => {
                onImportChannelGroupClick();
            });
        }
    }

    window.onload = () => {
        getFromStorage();
        main();
    }

})()