const port = chrome.runtime.connect({ name: "content" });
const errorMsg = document.getElementById('error-message')

port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'register':
            const status = msg.data.response.status
            if(status) {
                setErrorMessage('Registration successful')
            } else {
                const errorMsg  = msg.data.response.error
                setErrorMessage(errorMsg)
            }
            break
    }
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
    const confirmPassword = document.getElementById('confirmPassword').value

    if(!email || !password || !confirmPassword) { //check if any fields are empty
        setErrorMessage('Please fill out all fields')
        return
    } else if(!isValidEmail(email)) { // check if email is valid
        setErrorMessage('Email is not valid')
        return
    } else if(password.length < 8) { // check if password is at least 8 characters long
        setErrorMessage('Password must be at least 8 characters long')
        return
    } else if(password !== confirmPassword) { // check if passwords match
        setErrorMessage('Passwords do not match')
        return
    } else {
        setErrorMessage('')
    }

    port.postMessage({ action: 'register', email, password })
}

const submitButton = document.querySelector('button')
submitButton.addEventListener('click', handleSubmit)