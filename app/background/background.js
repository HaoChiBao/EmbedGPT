import {queryChat} from "./async/func/functions.js";
import System from "../auth/system.js";

const system = new System()
const main = async () => {
    const userCredentials = await chrome.storage.local.get('w_userCredentials')
    // console.log(userCredentials)
    if(userCredentials.w_userCredentials) {
        console.log('User is logged in')
        await system.init(userCredentials.w_userCredentials)
        console.log(system.userData)
    }
}
main()

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

            let chatHistory = null
            let chat_model = null
            // switch on the action (This is where the magic happens!)
            switch(msg.action) {
                case 'saveChats':
                    if(system.isLoggedIn()) {
                        const allChats = msg.allChats
                        console.log(allChats)
                    } else {
                        response.data.response = {status: false, error: 'User not logged in'}
                    }
                    break; 

                case 'register':
                    const r_email = msg.email
                    const r_password = msg.password
                    response.data.response = await system.register(r_email, r_password)
                    // save the user's email and password to the local storage
                    await chrome.storage.local.set({w_userCredentials: system.userCredentials})
                    break;
                    
                case 'login':
                    const l_email = msg.email
                    const l_password = msg.password
                    response.data.response = await system.login(l_email, l_password)
                    await chrome.storage.local.set({w_userCredentials: system.userCredentials})
                    break;

                case 'refresh':
                    // keeps the service worker actuve
                    break;

                case 'capture':
                    const dimensions = msg.dimensions || { x: 0, y: 0, width: 200, height: 150 }; // Default dimensions if not provided
                    const originalDimensions = msg.originalDimensions || { width: 200, height: 150 }; // Default dimensions if not provided

                    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" })
                    response.data.dataUrl = dataUrl
                    response.data.dimensions = dimensions

                    // chrome.tabs.create({ url: dataUrl})
                    // response.dataUrl = dataUrl
                    break;
                
                case 'queryImage':
                    const imageData = msg.imageData
                    chatHistory = msg.chatHistory
                    chat_model = msg.chat_model

                    response.data.content = await queryChat(chatHistory, imageData, chat_model)
                    break;

                case 'queryText':
                    chatHistory = msg.chatHistory
                    chat_model = msg.chat_model

                    response.data.content = await queryChat(chatHistory, null, chat_model)
                    break;
            }
            port.postMessage(response);
        });
    }
})
