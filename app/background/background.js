
chrome.runtime.onStartup.addListener(() => {
    console.log(`onStartup()`)
})

// listen for messages from the content script
chrome.runtime.onConnect.addListener((port) => {
    if(port.name === "content") {
        port.onMessage.addListener(async (msg) => {
            console.log(msg)

            if(!msg.action) {port.postMessage({error: 'action not specified'}) ;return}

            const response = { 
                action: msg.action,
                data: {}
            }
            switch(msg.action) {

                case 'capture':
                    const dimensions = msg.dimensions || { x: 0, y: 0, width: 200, height: 150 }; // Default dimensions if not provided
                    const originalDimensions = msg.originalDimensions || { width: 200, height: 150 }; // Default dimensions if not provided

                    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" })
                    response.data.dataUrl = dataUrl
                    response.data.dimensions = dimensions

                    // chrome.tabs.create({ url: dataUrl})
                    // response.dataUrl = dataUrl
                    break;

                case 'refresh':
                    // keeps the service worker actuve
                    break;

            }
            port.postMessage(response);
        });
    }
})
