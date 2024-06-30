
function setEventHanlder() {
    const reloadGroupNameBtn = document.querySelector('#reload-groups') ?? null;
    if (reloadGroupNameBtn !== null) {
        reloadGroupNameBtn.addEventListener("click", (event) => onReloadGroupClick());
    }

    const addGroupNameBtn = document.querySelector('#add-group') ?? null;
    if (addGroupNameBtn !== null) {
        addGroupNameBtn.addEventListener("click", (event) => onAddGroupClick());
    }

    const saveGroupNameBtn = document.querySelector('#save-groups') ?? null;
    if (saveGroupNameBtn !== null) {
        saveGroupNameBtn.addEventListener("click", (event) => onSaveGroupClick());
    }

    const exportGroupNameBtn = document.querySelector('#export-groups') ?? null;
    if (exportGroupNameBtn !== null) {
        exportGroupNameBtn.addEventListener("click", (event) => onExportGroupsClick());
    }

    const importGroupNameBtn = document.querySelector('#import-groups') ?? null;
    if (importGroupNameBtn !== null) {
        importGroupNameBtn.addEventListener("click", (event) => onImportGroupsClick());
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

async function loadSubcriptionChannelsFromStorage() {

    const data = await chrome.storage.local.get("channels");

    if (data.channels === undefined || data.channels === null) {
        return;
    }

    subscriptionChannels = Array.from(data.channels);
}

async function loadGroupsFromStorage() {

    const data = await chrome.storage.local.get("groups");

    if (data.groups === undefined || data.groups === null) {
        return;
    }

    lastsaveGroups = Array.from(data.groups);
}

async function loadSettingsFromStorage() {

    const data = await chrome.storage.local.get("settings");

    if (data.settings === undefined || data.settings === null) {
        return;
    }

    lastsaveSettings = Array.from(data.settings);
}

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

async function main() {

    try {
        await loadConfig();

        applyGroups(lastsaveGroups);

        applyGrouping(lastsaveSettings);

        setFilterArea();

        setEventHanlder();
    }
    catch (error) {
        console.log("popup error : ", error);
    }
}

window.onload = () => {
    main();
}
