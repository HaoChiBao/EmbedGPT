
const GPT_ENDPOINT = "https://api.openai.com/v1/chat/completions"
const api_key = ""

const chatGPT_Image_Query  = async (chatHistory, imageData) => {
    const response = await fetch(GPT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: chatHistory,
        })
    })
    return await response.json()
}

const chatGPT_Text_Query  = async (chatHistory) => {
    const response = await fetch(GPT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({
            model: "gpt-4",
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