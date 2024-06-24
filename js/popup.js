
function setEventHanlder() {
    const reloadGroupNameBtn = document.querySelector('#reload-group-name') ?? null;
    if (reloadGroupNameBtn !== null) {
        reloadGroupNameBtn.addEventListener("click", (event) => onReloadGroupNameClick());
    }

    const addGroupNameBtn = document.querySelector('#add-group-name') ?? null;
    if (addGroupNameBtn !== null) {
        addGroupNameBtn.addEventListener("click", (event) => onAddGroupNameClick());
    }

    const saveGroupNameBtn = document.querySelector('#save-group-name') ?? null;
    if (saveGroupNameBtn !== null) {
        saveGroupNameBtn.addEventListener("click", (event) => onSaveGroupNameClick());
    }

    const exportGroupNameBtn = document.querySelector('#export-group-name') ?? null;
    if (exportGroupNameBtn !== null) {
        exportGroupNameBtn.addEventListener("click", (event) => onExportGroupNameClick());
    }

    const importGroupNameBtn = document.querySelector('#import-group-name') ?? null;
    if (importGroupNameBtn !== null) {
        importGroupNameBtn.addEventListener("click", (event) => onImportGroupNameClick());
    }

    const reloadGroupingBtn = document.querySelector('#reload-grouping') ?? null;
    if (reloadGroupingBtn !== null) {
        reloadGroupingBtn.addEventListener("click", (event) => onReloadGroupingClick());
    }

    const saveGroupingBtn = document.querySelector('#save-grouping') ?? null;
    if (saveGroupingBtn !== null) {
        saveGroupingBtn.addEventListener("click", (event) => onSaveGroupingClick());
    }

    const exportGroupingBtn = document.querySelector('#export-grouping') ?? null;
    if (exportGroupingBtn !== null) {
        exportGroupingBtn.addEventListener("click", (event) => onExportGroupingClick());
    }

    const importGroupingBtn = document.querySelector('#import-grouping') ?? null;
    if (importGroupingBtn !== null) {
        importGroupingBtn.addEventListener("click", (event) => onImportGroupingClick());
    }
}

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

    try {
        await loadSubcriptionChannelsFromStorage();

        await loadGroupsFromStorage();

        await loadSettingsFromStorage();
    }
    catch (error) {
        console.log("failed load config");
    }
}

// main process
async function main() {

    try {
        await loadConfig();

        applyGroupNames(lastsaveGroups);

        updateGroupingTable(lastsaveSettings);

        setEventHanlder();
    }
    catch (error) {
        console.log("popup error : ", error);
    }
}

window.onload = () => {
    main();
}
