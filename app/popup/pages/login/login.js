let port = chrome.runtime.connect({ name: "content" });

const errorMsg = document.getElementById('error-message')

port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'login':
            const status = msg.data.response.status
            if(status) {
                setErrorMessage('Registration successful')
                window.location.href = '../chat/chat.html'
            } else {
                const errorMsg  = msg.data.response.error
                setErrorMessage(errorMsg)
            }
            break
        case 'refresh':
            // keeps the service worker actuve
            setTimeout(() => {
                try{
                    port.postMessage({ action: 'refresh' });
                } catch(e) {
                    console.error(e)
                }
            }, 20000)
            break;
    }
})

port.onDisconnect.addListener(() => {
    console.log('port disconnected')
})

const setErrorMessage = (message) => {
    errorMsg.innerText = message
    // shake animation
    errorMsg.classList.add('shake')
    setTimeout(() => {
        errorMsg.classList.remove('shake')
    }, 500)
}

const isValidEmail = (email) => {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
}

const handleSubmit = async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    if(!email || !password) { //check if any fields are empty
        setErrorMessage('Please fill out all fields')
        return
    } else if(!isValidEmail(email)) { // check if email is valid
        setErrorMessage('Email is not valid')
        return
    } else {
        setErrorMessage('')
    }

    port.postMessage({ action: 'login', email, password })
}

const submitButton = document.querySelector('button')
submitButton.addEventListener('click', handleSubmit)
window.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') {
        handleSubmit(e)
    }
})

port.postMessage({ action: 'refresh' })