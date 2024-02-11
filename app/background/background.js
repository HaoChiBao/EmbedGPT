chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log(request, sender, sendResponse)
    if (request.action === "capture") {
        const dimensions = request.dimensions || { x: 0, y: 0, width: 200, height: 150 }; // Default dimensions if not provided
        const originalDimensions = request.originalDimensions || { width: 200, height: 150 }; // Default dimensions if not provided
        await chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
            // You can send the dataUrl to a server or display it on the page
            console.log(dataUrl);
            // Open a new tab with the captured image
            // chrome.tabs.create({ url: dataUrl });

            sendResponse({ message: "Captured" });
        });
    }
    return true;
});

chrome.runtime.onConnect.addListener((port) => {
    if(port.name === "content") {
        port.onMessage.addListener(async (msg) => {
            // console.log(msg)

            const response = { 
                message: "Received"
                // fill in the response
            }
            switch(msg.action) {
                case "test":
                    
                    break;

                case 'capture':
                    const dimensions = msg.dimensions || { x: 0, y: 0, width: 200, height: 150 }; // Default dimensions if not provided
                    const originalDimensions = msg.originalDimensions || { width: 200, height: 150 }; // Default dimensions if not provided
                    await chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
                        // You can send the dataUrl to a server or display it on the page
                        console.log(dataUrl);
                        // Open a new tab with the captured image
                        // chrome.tabs.create({ url: dataUrl });

                        port.postMessage({ message: "Captured" });
                    });
                    break;
            }

            port.postMessage(response);
        });
    }
})
