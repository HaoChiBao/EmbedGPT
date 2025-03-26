import {OPENAI_API_KEY} from './API_KEYS.js'

const GPT_INFO = {
    GPT_ENDPOINT: "https://api.openai.com/v1/chat/completions",
    GPT_IMAGE_MODAL: "gpt-4o",
    // GPT_IMAGE_MODAL: "gpt-4-vision-preview",
    // GPT_IMAGE_MODAL: "gpt-4-turbo",
    GPT_TEXT_MODAL: "gpt-4",
    API_KEY: OPENAI_API_KEY
}

const queryChat = async (chatHistory, userCredentials) => {
    console.log(userCredentials)
    // const response = await fetch(GPT_INFO.GPT_ENDPOINT, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${GPT_INFO.API_KEY}`
    //     },
    //     body: JSON.stringify({
    //         model: GPT_INFO.GPT_IMAGE_MODAL,
    //         messages: chatHistory,
    //     })
    // })

    const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chatHistory,
            userCredentials
        })
    })
    return await response.json()
}


export {queryChat};