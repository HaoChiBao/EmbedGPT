const start_btn = document.querySelector('button');

// redirect to chat page

const main = async () => {

    // window.location.href = "pages/settings/settings.html"; return;
    const userCredentials = await chrome.storage.local.get('w_userCredentials')
    // console.log(userCredentials)
    if(userCredentials.w_userCredentials) {
        console.log('User is logged in')
        window.location.href = "pages/chat/chat.html";
    }
}
main()

start_btn.addEventListener('click', () => {
    window.location.href = "pages/register/register.html";
});
