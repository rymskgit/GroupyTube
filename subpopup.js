(function () {

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

        const importJsonBtn = document.querySelector('#import-json') ?? null;
        if (importJsonBtn !== null) {
            importJsonBtn.addEventListener('click', (event) => {

                const parentDocument = window.parent.document;

                const frame = parentDocument.querySelector('#subpopup-overlay') ?? null;
                if (frame === null) {
                    return;
                }

                try {
                    const groups = JSON.parse(jsonText.value);

                    if (frame.dataType === "group-name") {
                        chrome.runtime.sendMessage({ type: "import-group", data: groups });
                    }
                    else if (frame.dataType === "grouping") {
                        chrome.runtime.sendMessage({ type: "import-grouping", data: groups });
                    }

                    frame.style.display = 'none';
                }
                catch (e) {
                    console.log("invalid json");
                }
            });
        }
    }

    window.onload = () => {
        main();
    }
})();