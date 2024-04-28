// ________ Global Variables ______

// menu elements
const menu = document.querySelector('.menu');
const menuButton = document.querySelector('.menu-button');
const sections = document.querySelectorAll('section');

const menu_section = document.querySelector('.menu-section');

// chat body elements
const chat_body = document.getElementById('chat-body');

// form/query elements
const form = document.getElementById('chat-search');

const port = chrome.runtime.connect({ name: "content" });

const allChats = [
    {timestamp: Date.now(), chatHistory: [
        {
            role: 'user',
            content: 'how far is the sun from the earth?'
        },
        {
            role: 'system',
            content: 'Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        },
        {
            role: 'user',
            content: 'what is the capital of Nigeria?',
        },
        {
            role: 'system',
            content: 'Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        },
    ], title: 'test1'},
    // timestamp set from yesterday
    {timestamp: Date.now() - 86400000, chatHistory: [
        {
            role: 'user',
            content: 'how far is the sun from the earth?2'
        },
    ], title: 'test2'},
    // timestamp set from last week
    {timestamp: Date.now() - 604800000, chatHistory: [
        {
            role: 'user',
            content: 'how far is the sun from the earth?3'
        },
    ], title: 'test3'},
    // timestamp set from last month
    {timestamp: Date.now() - 2628000000, chatHistory: [
        {
            role: 'user',
            content: 'how far is the sun from the earth?4'
        },
    ], title: 'test4'},
]

let currentChat = 0;

let currentChatHistory = allChats[currentChat].chatHistory;


// _________________________________MENU___________________________________


const toggleMenu = () => {
    if (menuButton.classList.contains('active')) {
        closeMenu();
    } else {
        render_all_chats();
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

const create_new_chat = () => {
    const last_chat = allChats[allChats.length - 1];
    if(last_chat.chatHistory.length === 0) return

    const new_chat = {timestamp: Date.now(), chatHistory: [], title: 'meh'};
    allChats.push(new_chat);
    currentChat = allChats.indexOf(new_chat);
    currentChatHistory = allChats[currentChat].chatHistory;

    load_chat();
}

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
        create_new_chat();
        // console.log(0)
    }, 300)
})

const hide_menu_header = (id) => {
    const menu_header = document.getElementById(`header-${id}`);
    menu_header.style.display = 'none';
}

const show_menu_header = (id) => {
    const menu_header = document.getElementById(`header-${id}`);
    menu_header.style.display = 'flex';
}

const get_menu_header = (id) => {
    return document.getElementById(`header-${id}`);
}

const create_menu_header = (title) => {
    const menu_header = document.createElement('div');
    menu_header.classList.add('menu-header');

    const menu_item_timestamp = document.createElement('div');
    menu_item_timestamp.classList.add('menu-item-timestamp');

    const h3 = document.createElement('h3');
    h3.innerHTML = title;

    const line = document.createElement('div');
    line.classList.add('line');

    menu_item_timestamp.appendChild(h3);
    menu_item_timestamp.appendChild(line);

    const menu_items = document.createElement('div');
    menu_items.classList.add('menu-items');

    menu_header.appendChild(menu_item_timestamp);
    menu_header.appendChild(menu_items);

    return menu_header;
}

// 
const create_menu_item = (chat) => {
    const menu_item = document.createElement('div');
    menu_item.classList.add('menu-item');

    const chat_image = document.createElement('img');
    chat_image.classList.add('chat-image');
    chat_image.src = '../../../../images/chat.png';

    const chat_text = document.createElement('p');
    chat_text.innerHTML = chat.title;

    const chat_dots = document.createElement('button');
    chat_dots.classList.add('chat-dots');

    const dots_image = document.createElement('img');
    dots_image.src = '../../../../images/dots.png';

    chat_dots.appendChild(dots_image);

    menu_item.appendChild(chat_image);
    menu_item.appendChild(chat_text);
    menu_item.appendChild(chat_dots);

    return menu_item;
}

/* 
    sort chats by timestamps
    separated by:
        Today
        Yesterday
        Last Week
        Last Month
        Older
*/
const render_all_chats = () => {
    console.log(0)
    // clear all menu items/headers
    for(let i = 0; i < 5; i++) {
        hide_menu_header(i);
        const menu_header = get_menu_header(i);
        const menu_items = menu_header.querySelector('.menu-items');
        menu_items.innerHTML = '';
    }

    const current_date = Date.now();
    // const menu_header = create_menu_header('Today');
    // menu_section.appendChild(menu_header);

    allChats.forEach(chat => {
        const timestamp = chat.timestamp;

        const menu_item = create_menu_item(chat);

        let header_id = 0;

        if(timestamp > current_date - 86400000) {header_id = 0} // Today 
        else if(timestamp > current_date - 172800000) {header_id = 1} // Yesterday 
        else if(timestamp > current_date - 604800000) {header_id = 2} // Last Week 
        else if(timestamp > current_date - 2628000000) {header_id = 3} // Last Month 
        else {header_id = 4} //Older
        
        show_menu_header(header_id);
        const menu_header = get_menu_header(header_id);
        const menu_items = menu_header.querySelector('.menu-items');
        menu_items.appendChild(menu_item);

        menu_item.addEventListener('click', () => {
            currentChat = allChats.indexOf(chat);
            currentChatHistory = allChats[currentChat].chatHistory;
            load_chat();
        })
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
}

render_all_chats();

chat_body.addEventListener('click', ()=>{
    closeMenu();
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
    chat_body.innerHTML = '';

    if(currentChatHistory.length === 0) {
        const empty_chat = document.createElement('div');
        empty_chat.classList.add('empty-chat');
        empty_chat.innerHTML = 'start a conversation...';
        chat_body.appendChild(empty_chat)
    }

    currentChatHistory.forEach(chat => {
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
    currentChatHistory.push({ role, content });

    // update timestamp (last sent message)
    allChats[currentChat].timestamp = Date.now();
}

// ___________________________________FORM___________________________________


port.onMessage.addListener((msg) => {
    console.log(msg)
    switch(msg.action) {
        case 'queryText':
            const response_message = msg.data.content.choices[0].message.content;
            update_chat_history(1, response_message); // add system response to chat history
            render_response(response_message); // display system response (with animation) in chat

            console.log(currentChatHistory)
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
        chatHistory: currentChatHistory,
    });
}

form.addEventListener('submit', handleSubmit)