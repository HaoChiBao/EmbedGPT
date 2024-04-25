// ________ Global Variables ______

// header elements
const header = document.getElementById('chat-header'); 
const title = header.querySelector('h2');

// form/query elements
const form = document.getElementById('chat-search');

const port = chrome.runtime.connect({ name: "content" });

let chatHistory = [
    // {
    //     role: 'user',
    //     content: 'how far is the sun from the earth?'
    // },
    // {
    //     role: 'system',
    //     content: 'The average distance from the Earth to the Sun is 93 million miles (150 million kilometers).'
    // },
    // {
    //     role: 'user',
    //     content: 'what is the capital of Nigeria?',
    // }
]


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
let lastChat = null;
const menu_chats = document.querySelectorAll('.menu-item');
menu_chats.forEach(menu_chat => {
    
    const activateChat = () => {
        lastChat = menu_chat;

        menu_chat.classList.add('active');
        const chat_image = menu_chat.querySelector('.chat-image');
        chat_image.style.transform = 'scale(0)';
        setTimeout(() => {
            chat_image.src = '../../../../images/stars.png';
            chat_image.style.transform = 'scale(1)';
        }, 200)
    }
    
    const deactivateChat = (chat) => {
        if(!chat) return

        chat.classList.remove('active');
        const chat_image = chat.querySelector('.chat-image');
        chat_image.style.transform = 'scale(0)';
        setTimeout(() => {
            chat_image.src = '../../../../images/chat.png';
            chat_image.style.transform = 'scale(1)';
        }, 200)
    }

    const deactivateLastChat = () => {
        deactivateChat(lastChat);
    }

    menu_chat.addEventListener('click', () => {
        deactivateLastChat();
        activateChat();

        // wait for animation to finish before closing menu
        setTimeout(() => {
            closeMenu();
        }, 500)
    })
})

// ___________________________________HEADER___________________________________

// ___________________________________CHAT___________________________________

// used when chat is first loaded
const load_chat = () => {

}

// used when chat is updated
const render_response = () => {

}


// add new message to chat history
const update_chat_history = (role = 0, content) => {
    // determine role
    role = role === 0 ? 'user' : 'system';
    chatHistory.push({ role, content });

    // update chat on screen
    render_chat();
}

// ___________________________________FORM___________________________________




port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'queryText':
            const response_message = msg.data.content.choices[0].message.content;
            update_chat_history(1, response_message);

            console.log(chatHistory)
            break;
        default:
            console.log('Invalid action')
    }
})


const handleSubmit = async (e) => {
    e.preventDefault()

    const input = form.querySelector('input');
    const query = input.value;
    input.value = '';

    if(query === '') return

    console.log('Submitting query:', query)

    update_chat_history(0, query);
    
    port.postMessage({ 
        action: 'queryText', 
        chatModel: 0,
        chatHistory: chatHistory,
    });
}

form.addEventListener('submit', handleSubmit)