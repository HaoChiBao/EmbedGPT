
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

const create_chat_button = document.getElementById('create-new-chat');
const create_chat_img = create_chat_button.querySelector('img'); 

let create_chat_pressed = false;
create_chat_button.addEventListener('mouseover', async () => {
    if(create_chat_pressed) return
    create_chat_button.style.transform = 'translateY(-6px) scale(1.1)';
    create_chat_img.style.transform = 'scale(0)';
    setTimeout(() => {
        create_chat_img.src = '../../../../images/stars.png';
        create_chat_img.style.transform = 'scale(1)';
    }, 200)
})

create_chat_button.addEventListener('mouseout', () => {
    if(!create_chat_pressed) create_chat_button.style.transform = 'translateY(0) scale(1)';
    create_chat_img.style.transform = 'scale(0)';
    setTimeout(() => {
        create_chat_img.src = '../../../../images/plus.png';
        if(!create_chat_pressed) create_chat_img.style.transform = 'scale(1)';
    }, 200)
})

create_chat_button.addEventListener('click', () => {
    create_chat_pressed = true;
    create_chat_button.style.transform = 'scale(0.85)';
    setTimeout(() => {
        create_chat_pressed = false;
        create_chat_button.style.transform = 'scale(1)';
        closeMenu();

        console.log(0)
    }, 300)
})

// menu items
const menu_headers = document.querySelectorAll('.menu-header');
menu_headers.forEach(header => {

    const button = header.querySelector('.menu-item-toggle');
    const menu_items = header.querySelector('.menu-items');

    const openItems = () => {
        button.classList.add('active');
    }

    const closeItems = () => {
        button.classList.remove('active');
    }

    const toggleItems = () => {
        if (button.classList.contains('active')) {
            closeItems();
        } else {
            openItems();
        }
    }

    button.addEventListener('click', () => {
        toggleItems();
    })
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