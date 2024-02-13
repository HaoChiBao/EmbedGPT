
// _________________________________MENU___________________________________

const menu = document.querySelector('.menu');
const menuButton = document.querySelector('.menu-button');
const sections = document.querySelectorAll('section');

const toggleMenu = () => {
    if (menuButton.classList.contains('active')) {
        closeMenu();
    } else {
        openMenu();
    }

}

const openMenu = () => {
    menuButton.classList.add('active');
    menu.classList.add('active');
    sections.forEach(section => {
        section.classList.add('active');
    })
}

const closeMenu = () => {
    menuButton.classList.remove('active');
    menu.classList.remove('active');
    sections.forEach(section => {
        section.classList.remove('active');
    })
}

menuButton.addEventListener('click', () => {
    toggleMenu()
})

// ___________________________________HEADER___________________________________

const header = document.getElementById('chat-header');
const title = header.querySelector('h2');




// ___________________________________CHAT___________________________________



// ___________________________________FORM___________________________________


// const test = document.getElementById('test');

// const port = chrome.runtime.connect({ name: "content" });


// const chatHistory = [
//     {
//         role: 'user',
//         content: 'how far is the sun from the earth?'
//     },
//     {
//         role: 'system',
//         content: 'The average distance from the Earth to the Sun is 93 million miles (150 million kilometers).'
//     },
//     {
//         role: 'user',
//         content: 'what is the capital of Nigeria?',
//     }
// ]

// port.onMessage.addListener((msg) => {
//     console.log(msg)
// })

// test.addEventListener('click', () => {
//     port.postMessage({ 
//         action: 'queryText', 
//         chatModel: 0,
//         chatHistory: chatHistory,
//     });
// })

const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('submitting')
}