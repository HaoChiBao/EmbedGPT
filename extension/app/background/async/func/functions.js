// const URL = 'http://localhost:3000/chat';
const URL = 'https://wadoyuse-server-production.up.railway.app/chat';

const queryChat = async (chatHistory, userCredentials) => {
    console.log(userCredentials)
    const response = await fetch(URL, {
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

// wasd