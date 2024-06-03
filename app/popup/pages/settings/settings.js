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
    redirectChat.addEventListener('click', () => {
        window.location.href = "../chat/chat.html";
    })
}
main()

// const btnSignOut = document.querySelector('button')
// btnSignOut.addEventListener('click', () => {
//     port.postMessage({ action: 'signOut' })
// })


port.postMessage({ action: 'refresh' })