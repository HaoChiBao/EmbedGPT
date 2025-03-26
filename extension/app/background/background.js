import {queryChat} from "./async/func/functions.js";
import System from "../auth/system.js";

const system = new System()
const main = async () => {
    const userCredentials = await chrome.storage.local.get('w_userCredentials')
    // console.log(userCredentials)
    if(userCredentials.w_userCredentials) {
        const keys = Object.keys(userCredentials.w_userCredentials)
        if(keys.length === 0) return

        console.log('User is logged in')
        await system.init(userCredentials.w_userCredentials)
        // console.log(system.userData)
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
                        try{
                            system.userData.data.allChats = allChats
                            console.log(system.userData.data.allChats)
                            response.data.response = {status: true, response: await system.updateUser()}
                        } catch(e) {
                            response.data.response = {status: false, error: e.message}
                        }
                    } else {
                        response.data.response = {status: false, error: 'User not logged in'}
                    }
                    break; 

                case 'signOut':
                    system.signOut()
                    await chrome.storage.local.remove('w_userCredentials')
                    await chrome.storage.local.remove('allChats')
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
                    
                    // if the login was successful, save the user's email and password to the local storage
                    if(system.isLoggedIn()) { 
                        await chrome.storage.local.set({w_userCredentials: system.userCredentials})

                        // get the user's data from the database
                        if(!system.userData.data.allChats) {
                            system.userData.data.allChats = {}
                        }

                        // check that all of the chats have a title, timestamp, id, and chatHistory
                        const loaded_allChats = system.userData.data.allChats
                        const chat_ids = Object.keys(loaded_allChats)
                        chat_ids.forEach(id => {
                            const chat = loaded_allChats[id]
                            if(!chat.title) {chat.title = 'New Chat'}
                            if(!chat.timestamp) {chat.timestamp = Date.now()}
                            if(!chat.id) {chat.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}
                            if(!chat.chatHistory) {chat.chatHistory = []}
                        })

                        await chrome.storage.local.set({allChats: loaded_allChats})
                    }
                    break;

                case 'userCredentials':
                    response.data.userCredentials = system.userCredentials
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

                    
                    response.data.content = await queryChat(chatHistory, system.userCredentials)
                    break;

                case 'queryText':
                    chatHistory = msg.chatHistory
                    chat_model = msg.chat_model

                    response.data.content = await queryChat(chatHistory, system.userCredentials)
                    break;
            }
            try{
                port.postMessage(response);
            } catch(e) {
                // console.error(e)
            }
        });
    }
})

// terst