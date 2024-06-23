(async function () {

    const config = {};

    const head = document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.textContent = `
    
        .channel-group{
            display:flex;
            margin-left:15px;
            margin-top:5px;
            margin-bottom:5px;
        }

        .group-icon{
            width:18px;    
            height:18px;
        }

        .group-tilte{
            margin-left:10px;
            margin-top:-3px;
            margin-bottom:5px;     
            font-family:'Meiryo' !important;
            font-size:12pt !important;
            color:whitesmoke;
            font-style:normal
        }

        .dot-icon{
            margin 0px;
            margin-top:3px;
            margin-left:10px;
            width:12px;    
            height:12px;
            scale:0.7;
        }
    `;

    head.appendChild(style);

    function escape(text) {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
    }

    // load groups from storage
    async function loadGroups() {

        const data = await chrome.storage.local.get("groups");

        if (data.groups === undefined || data.groups === null) {
            data.groups = [];
            return;
        }

        config.groups = Array.from(data.groups);

    }

    // load setting for grouping from storage
    async function loadSettings() {
        const data = await chrome.storage.local.get("settings");

        if (data.settings === undefined || data.settings === null) {
            config.settings = [];
            return;
        }

        config.settings = Array.from(data.settings);
    }

    // load config from storage
    async function loadConfig() {

        await loadGroups();

        await loadSettings();
    }

    await loadConfig();

    const rightAllowUrl = chrome.runtime.getURL("images/right_allow.png");
    const downAllowUrl = chrome.runtime.getURL("images/down_allow.png");
    const dotUrl = chrome.runtime.getURL("images/dot.png");

    // update group status
    function updateGroupStatus(element) {

        const query = element.parentNode.querySelectorAll("ytd-guide-entry-renderer[line-end-style]");
        const elements = Array.from(query);

        const value = elements.find((e) => {
            const line_end_style = e.getAttribute("line-end-style");
            return line_end_style === "dot";
        }) ?? null;

        if (value === null) {
            if (element.parentNode.previousElementSibling !== null) {
                const dot_icon = element.parentNode.previousElementSibling.querySelector('#dot-icon') ?? null;
                if (dot_icon !== null) {
                    dot_icon.style.display = "none";
                }
            }
        }
    }

    // create channel group title element
    function createGroupTitleElement(group, lineEndStyle, groupElement) {

        const title = group.name;

        const group_title = document.createElement("div");
        group_title.classList.add("channel-group");

        // title string
        const title_string = document.createElement("span");
        title_string.innerText = title;
        title_string.classList.add("group-tilte");

        // icon
        const title_icon = document.createElement("img");
        title_icon.classList.add("group-icon");
        title_icon.setAttribute("src", rightAllowUrl)

        group_title.append(title_icon);
        group_title.append(title_string);

        // dot for new contents
        const dot_icon = document.createElement("img");
        dot_icon.setAttribute("src", dotUrl);
        dot_icon.setAttribute("id", "dot-icon");
        dot_icon.classList.add("dot-icon");
        if (lineEndStyle === "dot") {
            dot_icon.style.display = "unset";
        }
        else {
            dot_icon.style.display = "none";
        }
        group_title.append(dot_icon);

        // add event handler
        group_title.addEventListener("mouseover", () => {
            title_string.style.cursor = "pointer";
        });

        group_title.addEventListener("mouseleave", () => {
            title_string.style.cursor = "default";
        });

        // for change group hidden and visible
        group_title.addEventListener('click', (event) => {
            if (groupElement.style.display === "none") {
                groupElement.style.display = "unset";
                title_icon.setAttribute("src", downAllowUrl);
            }
            else {
                groupElement.style.display = "none";
                title_icon.setAttribute("src", rightAllowUrl);
            }
        });

        return group_title;
    }

    // create group element
    function createGroupElement(groupAccounts, channels) {

        const ytd_guide_entry_group_renderer = document.createElement("ytd-guide-entry-group-renderer");

        let lineEndStyle = "";
        groupAccounts.forEach((account) => {
            const value = channels.find((channel) => channel.account == account) ?? null;
            if (value !== null) {
                ytd_guide_entry_group_renderer.appendChild(value.element);

                value.element.addEventListener("click", (event) => {
                    value.element.setAttribute("line-end-style", "");
                    updateGroupStatus(value.element);
                });
                const line_end_style = value.element.getAttribute("line-end-style");
                if (line_end_style === "dot") {
                    lineEndStyle = line_end_style;
                }
            }
        });
        // once hidden
        ytd_guide_entry_group_renderer.style.display = "none";

        return [ytd_guide_entry_group_renderer, lineEndStyle];
    }

    // create channel group element
    function createChannelGroupElement(ytd_guide_section_renderer, channels) {

        if (config.settings === null) {
            return;
        }

        // make grouping settings per group
        let groups = [];
        config.settings.forEach((setting) => {
            let value = groups.find((value) => value.name == setting.groupname) ?? null;
            if (value === null) {
                const group = config.groups.find((value) => value.name === setting.groupname) ?? null;
                if (group !== null) {
                    groups.push({ name: setting.groupname, order: group.order, accounts: [setting.account] })
                }
                else {
                    groups.push({ name: setting.groupname, order: 999, accounts: [setting.account] })
                }
            } else {
                value.accounts.push(setting.account);
            }
        });
        groups = groups.sort((a, b) => a.order - b.order);

        groups.forEach((group) => {
            if (group.name !== "") {
                const [ytd_guide_entry_group_renderer, lineEndStyle] = createGroupElement(group.accounts, channels);
                const group_title = createGroupTitleElement(group, lineEndStyle, ytd_guide_entry_group_renderer);

                ytd_guide_section_renderer.appendChild(group_title);
                ytd_guide_section_renderer.appendChild(ytd_guide_entry_group_renderer);
            }
        });
    }


    // create ytd-guide-section-renderer element
    function createYtdGuideSection() {

        const element = document.querySelector('ytd-app div[id="content"] tp-yt-app-drawer div[id="contentContainer"] ytd-guide-renderer[id="guide-renderer"] div[id="sections"] ytd-guide-section-renderer:nth-child(1)') ?? null;
        if (element === null) {
            return null;
        }

        const ytd_guide_section_renderer = document.createElement("ytd-guide-section-renderer");
        ytd_guide_section_renderer.classList.add("style-scope");
        ytd_guide_section_renderer.classList.add("ytd-guide-renderer");
        ytd_guide_section_renderer.setAttribute("modern-typography", "");
        ytd_guide_section_renderer.setAttribute("guide-persistent-and-visible", "");

        element.insertAdjacentElement("afterend", ytd_guide_section_renderer);

        return ytd_guide_section_renderer;
    }

    // get subscription channel title, account and element
    function getSubscriptionChannels() {
        const query = document.querySelectorAll('ytd-app div[id="content"] tp-yt-app-drawer div[id="contentContainer"] ytd-guide-renderer[id="guide-renderer"] ytd-guide-section-renderer:nth-child(2) div[class*="ytd-guide-section-renderer"] ytd-guide-entry-renderer') ?? null;
        const elements = Array.from(query);

        const channels = elements.map((element) => {
            const endpoint = element.querySelector('a[id="endpoint"]') ?? null;
            const href = endpoint.getAttribute("href") ?? "";
            return { title: endpoint.getAttribute("title"), account: href.substring(1), element: element };
        }).filter((channel) => channel.account !== null && channel.account.startsWith("@") === true);

        return channels;
    }

    // expand subscription channel area
    function expandChannelElement() {

        // click more show link for expand subscription channel
        const moreshow = document.querySelector('ytd-app div[id="content"] tp-yt-app-drawer div[id="contentContainer"] ytd-guide-renderer[id="guide-renderer"] ytd-guide-collapsible-entry-renderer') ?? null;
        if (moreshow === null) {
            return;
        }
        const endpoint = moreshow.querySelector('a[id="endpoint"]') ?? null;
        endpoint.click();

        // hide collapser
        const expanded = moreshow.querySelector('div[id="expanded"] ytd-guide-entry-renderer[id="collapser-item"]') ?? null;
        expanded.style.display = "none";
    }

    // save subscription channel data
    function saveChannelData(channels) {

        const items = channels.map((channel) => ({ title: channel.title, account: channel.account }));

        // save channel data
        chrome.storage.local.set({ channels: items });
    }

    // main process
    function main() {

        // show all channel
        expandChannelElement();

        // get subscription channel list
        const channels = getSubscriptionChannels();

        // save subscription channel data
        saveChannelData(channels);

        // create section
        const ytd_guide_section_renderer = createYtdGuideSection();

        // create channel group
        createChannelGroupElement(ytd_guide_section_renderer, channels);
    }

    // pre-proces
    function proc() {

        // wait for visibled to subscription channel 
        const interval = setInterval(() => {

            const query = document.querySelectorAll('ytd-app div[id="content"] tp-yt-app-drawer div[id="contentContainer"] ytd-guide-renderer[id="guide-renderer"] ytd-guide-section-renderer:nth-child(2) div[class*="ytd-guide-section-renderer"] ytd-guide-entry-renderer') ?? null;

            if (query.length > 0) {
                clearInterval(interval);
                main();
            }
        }, 500);
    }

    window.onload = () => {
        proc();
    }
})();
