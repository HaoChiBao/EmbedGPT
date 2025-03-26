import dotenv from 'dotenv'

dotenv.config()

const GPT_INFO = {
    GPT_ENDPOINT: "https://api.openai.com/v1/chat/completions",
    GPT_MODAL: "gpt-4o",
    API_KEY: process.env.OPENAI_API_KEY as string
}

interface ChatMessage {
    role: string;
    content: string;
}

const queryChat = async (chatHistory: ChatMessage[]): Promise<any> => {
    const response = await fetch(GPT_INFO.GPT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GPT_INFO.API_KEY}`
        },
        body: JSON.stringify({
            model: GPT_INFO.GPT_MODAL,
            messages: chatHistory,
        })
    })
    return await response.json()
}

export { queryChat }