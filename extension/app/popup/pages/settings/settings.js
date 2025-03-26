const main = async () => {
    const port = chrome.runtime.connect({ name: "content" });
    const errorMsg = document.getElementById('error-message')

    port.onMessage.addListener((msg) => {
        console.log(msg)
        switch(msg.action) {
            case 'signOut':
                window.location.href = "../../popup.html";
                break;
            case 'userCredentials':
                emailText.innerText = msg.data.userCredentials.email
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

    const redirectChat = document.getElementById('redirect-chat')
    
    const email = document.getElementById('email')
    const emailText = email.querySelector('p')

    // const plan = document.getElementById('plan')
    // const planText = plan.querySelector('p')

    // const archive = document.getElementById('archive')

    // const theme = document.getElementById('color-theme')
    // const themeText = theme.querySelector('p')
    
    // const deleteChats = document.getElementById('delete-chats')
    const logout = document.getElementById('logout')

    // get user credentials
    const userCredentials = await chrome.storage.local.get('w_userCredentials')
    if(!userCredentials.w_userCredentials) {
        console.log('User is not logged in')
        window.location.href = "../../popup.html";
        return
    }

    emailText.innerText = userCredentials.w_userCredentials.email

    // ____________________________________________EMAIL BUTTON____________________________________________
    email.addEventListener('click', () => {console.log('email');})
    // ____________________________________________SUBSCRIPTION PLAN____________________________________________
    // plan.addEventListener('click', () => {console.log('plan');})
    // ____________________________________________ARCHIVE CHATS____________________________________________
    // archive.addEventListener('click', () => {console.log('archive');})
    
    
    // ____________________________________________COLOR THEME____________________________________________
    
    // const setTheme = async (theme) => {
    //     const r = document.querySelector('body')

    //     // --theme-color: #fff;
    //     // --theme-text: #000;
    //     // --theme-invert: 0;

    //     if(theme === 'dark') {
    //         await chrome.storage.local.set({ w_theme: 'dark' })
    //         r.style.setProperty('--theme-color', '#000')
    //         r.style.setProperty('--theme-text', '#fff')
    //         r.style.setProperty('--theme-invert', '1')
    //     } else {
    //         await chrome.storage.local.set({ w_theme: 'light' })
    //         r.style.setProperty('--theme-color', '#fff')
    //         r.style.setProperty('--theme-text', '#000')
    //         r.style.setProperty('--theme-invert', '0')
    //     }
    // }

    // // load theme style
    // const current_theme = await chrome.storage.local.get('w_theme')
    // if(!current_theme.w_theme) {
    //     await chrome.storage.local.set({ w_theme: 'dark' })
    // }

    // setTheme(current_theme.w_theme)
    // if(current_theme.w_theme === 'dark') {
    //     theme.classList.add('dark')
    //     themeText.innerText = 'dark mode'
    //     theme.querySelector('img').src = await chrome.runtime.getURL('images/moon.png')
    // } else {
    //     themeText.innerText = 'light mode'
    //     theme.querySelector('img').src = await chrome.runtime.getURL('images/sun.png')
    // }
    
    // // toggle between themes
    // theme.addEventListener('click', async () => {
    //     const themeIMG = theme.querySelector('img')
    //     const current_theme = await chrome.storage.local.get('w_theme')
    //     if(!current_theme.w_theme) {
    //         await chrome.storage.local.set({ w_theme: 'dark' })
    //     } 
        
    //     if(theme.classList.contains('dark')) {
    //         setTheme('light')
    //         theme.classList.remove('dark')
    //         themeText.innerText = 'light mode'
    //         themeIMG.src = await chrome.runtime.getURL('images/sun.png')
    //         await chrome.storage.local.set({ w_theme: 'light' })
    //     } else {
    //         setTheme('dark')
    //         theme.classList.add('dark')
    //         themeText.innerText = 'dark mode'
    //         themeIMG.src = await chrome.runtime.getURL('images/moon.png')
    //         await chrome.storage.local.set({ w_theme: 'dark' })
    //     }
        
    // })
    
    // ____________________________________________DELETE CHATS____________________________________________
    // deleteChats.addEventListener('click', () => {console.log('deleteChats');})
    
    // ____________________________________________REDIRECT CHAT____________________________________________
    redirectChat.addEventListener('click', () => {window.location.href = "../chat/chat.html";})
    
    // ____________________________________________LOGOUT USER____________________________________________
    logout.addEventListener('click', () => {port.postMessage({ action: 'signOut' })})



    port.postMessage({ action: 'refresh' })
}
main()

