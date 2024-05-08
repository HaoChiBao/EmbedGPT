import {OPENAI_API_KEY} from './API_KEYS.js'

const GPT_INFO = {
    GPT_ENDPOINT: "https://api.openai.com/v1/chat/completions",
    GPT_IMAGE_MODAL: "gpt-4-vision-preview",
    // GPT_IMAGE_MODAL: "gpt-4-turbo",
    GPT_TEXT_MODAL: "gpt-4",
    API_KEY: OPENAI_API_KEY
}

const chatGPT_Image_Query  = async (chatHistory, imageData) => {
    const response = await fetch(GPT_INFO.GPT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GPT_INFO.API_KEY}`
        },
        body: JSON.stringify({
            model: GPT_INFO.GPT_IMAGE_MODAL,
            messages: chatHistory,
        })
    })
    return await response.json()
}

const chatGPT_Text_Query  = async (chatHistory) => {
    const response = await fetch(GPT_INFO.GPT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GPT_INFO.API_KEY}`
        },
        body: JSON.stringify({
            model: GPT_INFO.GPT_TEXT_MODAL,
            messages: chatHistory,
        })
    })
    return await response.json()
}

const queryChat = async (chatHistory, imageData = null, chat_model = 0) => {
    switch (chat_model) {
        case 0:
            if(imageData) return await chatGPT_Image_Query(chatHistory, imageData)
            else return await chatGPT_Text_Query(chatHistory)
        case 1:
            // return await chatGPT_Text_Query(chatHistory, imageData)
        default:
            return 'Invalid chat model'
    }
}


export {queryChat};