// ________ Global Variables ______

// menu elements
const menu = document.querySelector('.menu');
const menuButton = document.querySelector('.menu-button');
const sections = document.querySelectorAll('section');

// chat body elements
const chat_body = document.getElementById('chat-body');

// form/query elements
const form = document.getElementById('chat-search');

const port = chrome.runtime.connect({ name: "content" });

const allChats = [
    {timestamp: Date.now(), chatHistory: [
        // {
        //     role: 'user',
        //     content: 'how far is the sun from the earth?'
        // },
        // {
        //     role: 'system',
        //     content: 'Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        // },
        // {
        //     role: 'user',
        //     content: 'what is the capital of Nigeria?',
        // },
        // {
        //     role: 'system',
        //     content: 'Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        // },
    ], title: ''},
]

let currentChat = 0;

let chatHistory = allChats[currentChat].chatHistory;


// _________________________________MENU___________________________________


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
    form.classList.add('active');
}

const closeMenu = () => {
    menuButton.classList.remove('active');
    menu.classList.remove('active');
    sections.forEach(section => {
        section.classList.remove('active');
    })
    form.classList.remove('active');
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

chat_body.addEventListener('click', ()=>{
    closeMenu();
    console.log(lastChat)
})

// ___________________________________HEADER___________________________________

// ___________________________________CHAT___________________________________

const create_chat_bubble = (role, content) => {
    const message_element = document.createElement('div'); 
    const profile_image = document.createElement('img');
    const message = document.createElement('p');

    if(role === 'user' || role === 0) {
        message_element.classList.add('user-chat');
        profile_image.src = '../../../../images/profile.png';
    } else {
        message_element.classList.add('system-chat');
        profile_image.src = '../../../../images/stars.png';
    }
    message_element.classList.add('message');
    message.innerHTML = content;

    message_element.appendChild(profile_image);
    message_element.appendChild(message);

    return message_element;
}
// used when chat is first loaded
const load_chat = () => {
    if(chatHistory.length === 0) {
        const empty_chat = document.createElement('div');
        empty_chat.classList.add('empty-chat');
        chat_body.appendChild(empty_chat)
        return
    }

    chat_body.innerHTML = '';

    chatHistory.forEach(chat => {
        const chat_element = create_chat_bubble(chat.role, chat.content);
        chat_body.appendChild(chat_element);
    })
    // set chat scroll to bottom
    chat_body.scrollTop = chat_body.scrollHeight;
}
load_chat();

let last_response_element = null;
// used when a response is returned
const render_response = (content) => {
    if(last_response_element == null) return

    let message = last_response_element.querySelector('p');
    message.innerHTML = '';
    let typed = ''; // current message content
    const loop = setInterval(() => {
        if(typed === content) {
            clearInterval(loop);
            return
        }
        typed += content[typed.length];
        message.innerHTML = typed;
    }, 1000 / 60);

    last_response_element = null;
}

const response_loading = () => {
    const response_element = create_chat_bubble('system', '');
    chat_body.appendChild(response_element);
    
    const message = response_element.querySelector('p');

    const loading_gif = document.createElement('img');
    loading_gif.classList.add('loading-gif');
    loading_gif.src = '../../../../images/typing.gif';

    message.appendChild(loading_gif);
    
    chat_body.scrollTop = chat_body.scrollHeight;
    last_response_element = response_element;

}

// add new message to chat history
const update_chat_history = (role = 0, content) => {
    // determine role
    role = role === 0 ? 'user' : 'system';
    chatHistory.push({ role, content });
}

// ___________________________________FORM___________________________________


port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'queryText':
            const response_message = msg.data.content.choices[0].message.content;
            update_chat_history(1, response_message); // add system response to chat history
            render_response(response_message); // display system response (with animation) in chat

            console.log(chatHistory)
            break;
        default:
            console.log('Invalid action')
    }
})

const setTitle = (title) => {
    allChats[currentChat].title = title;
}

const handleSubmit = async (e) => {
    e.preventDefault()

    const input = form.querySelector('input');
    const query = input.value;
    input.value = '';

    if(query === '') return

    console.log('Submitting query:', query)

    update_chat_history(0, query);
    if(allChats[currentChat].title === '') setTitle(query);
    load_chat();
    response_loading();

    console.log(allChats)
    
    
    port.postMessage({ 
        action: 'queryText', 
        chatModel: 0,
        chatHistory: chatHistory,
    });
}

form.addEventListener('submit', handleSubmit)