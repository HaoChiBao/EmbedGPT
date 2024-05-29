const port = chrome.runtime.connect({ name: "content" });

port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'register':
            break
    }
})

const handleSubmit = async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value
    
    console.log(email, password, confirmPassword)
    // port.postMessage({ action: 'register', email, password })
}

const submitButton = document.querySelector('button')
submitButton.addEventListener('click', handleSubmit)