// update message box
function updateMessage(message) {

    const messageBox = document.querySelector('#message') ?? null;

    messageBox.textContent = message;

    messageBox.style.visibility = "visible";

    setTimeout(() => {
        messageBox.style.visibility = "hidden";
    }, 3000);

}

// main process
function main() {

    const closeBtn = document.querySelector('#close-popup') ?? null;
    if (closeBtn !== null) {
        closeBtn.addEventListener('click', (event) => {

            const frame = window.parent.document.querySelector('#subpopup-overlay') ?? null;
            if (frame === null) {
                return;
            }
            frame.style.display = 'none';
        });
    }

    const copyJsonBtn = document.querySelector('#copy-json') ?? null;
    if (copyJsonBtn !== null) {
        copyJsonBtn.addEventListener('click', (event) => {

            const jsonText = document.querySelector('#jsonText') ?? null;
            if (jsonText === null) {
                return;
            }

            navigator.clipboard.writeText(jsonText.value);
        });
    }

    function validateData(data, dataType) {
        if (dataType === "group-name") {
            const groups = Array.from(data);
            groups.forEach((value) => {
                const name = value.name;
                const order = value.order;
                if (name === undefined || order === undefined) {
                    throw new Exception();
                }
            })
        }
        else if (dataType === "grouping") {
            const settings = Array.from(data);
            settings.forEach((value) => {
                const account = value.account;
                const groupname = value.groupname;
                const order = value.order;
                if (account === undefined || groupname === undefined || order === undefined) {
                    throw new Exception();
                }
            })
        }
    }

    const importJsonBtn = document.querySelector('#import-json') ?? null;
    if (importJsonBtn !== null) {
        importJsonBtn.addEventListener('click', (event) => {

            const parentDocument = window.parent.document;

            const frame = parentDocument.querySelector('#subpopup-overlay') ?? null;
            if (frame === null) {
                return;
            }

            try {
                const data = JSON.parse(jsonText.value);
                validateData(data, frame.dataType);

                if (frame.dataType === "group-name") {
                    chrome.runtime.sendMessage({ type: "import-group", data: data });
                }
                else if (frame.dataType === "grouping") {
                    chrome.runtime.sendMessage({ type: "import-grouping", data: data });
                }

                frame.style.display = 'none';
            }
            catch (e) {
                updateMessage("invalid json for import.");
            }
        });
    }
}

window.onload = () => {
    main();
}
