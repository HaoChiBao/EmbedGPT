const port = chrome.runtime.connect({ name: "content" });
const errorMsg = document.getElementById('error-message')

port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'signOut':
            window.location.href = "../../popup.html";
            break;
        case 'refresh':
            // keeps the service worker actuve
            setTimeout(() => {
                try{
                    port.postMessage({ action: 'refresh' });
                } catch(e) {
                    console.error(e)
                }
            }, 20000)
            break
    }
})

const main = async () => {
    const redirectChat = document.getElementById('redirect-chat')
    
    const email = document.getElementById('email')
    const emailText = email.querySelector('p')

    const plan = document.getElementById('plan')
    const planText = plan.querySelector('p')

    const archive = document.getElementById('archive')

    const theme = document.getElementById('color-theme')
    const themeText = theme.querySelector('p')
    
    const deleteChats = document.getElementById('delete-chats')
    const logout = document.getElementById('logout')

    // get user credentials
    const userCredentials = await chrome.storage.local.get('w_userCredentials')
    if(!userCredentials.w_userCredentials) {
        console.log('User is not logged in')
        window.location.href = "../../popup.html";
        return
    }

    emailText.innerText = userCredentials.w_userCredentials.email

    email.addEventListener('click', () => {console.log('email');})
    plan.addEventListener('click', () => {console.log('plan');})
    archive.addEventListener('click', () => {console.log('archive');})
    theme.addEventListener('click', () => {console.log('theme');})
    deleteChats.addEventListener('click', () => {console.log('deleteChats');})

    // return user to chat page
    redirectChat.addEventListener('click', () => {window.location.href = "../chat/chat.html";})

    // logout user
    logout.addEventListener('click', () => {port.postMessage({ action: 'signOut' })})
}
main()


port.postMessage({ action: 'refresh' })