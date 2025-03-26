const test_data = {
} 
    
// _______ Global Variables ______

const NEW_CHAT_NAME = "New Chat";

// premium items
const premium_items = document.getElementById('premium-items');
const smart_circle = document.getElementById('smart-circle');

// menu elements
const menu = document.querySelector('.menu');
const menuButton = document.querySelector('.menu-button');
const sections = document.querySelectorAll('section');

const menu_section = document.querySelector('.menu-section');

const create_chat_button = document.getElementById('create-new-chat');
const create_chat_img = create_chat_button.querySelector('img'); 

// chat body elements
const chat_body = document.getElementById('chat-body');

// form/query elements
const form = document.getElementById('chat-search');
const search_input = form.querySelector('input');

const port = chrome.runtime.connect({ name: "content" });

// determine last chat activated
let lastChatId = null;

let TEST = false;
// TEST = true;

let allChats = {}
if(TEST) allChats = test_data

let currentChatId = null
let currentChatHistory = null

let last_response_element = null;

let imagePreview_imageData = null;


// ___________________________________UTILS___________________________________
const create_unique_id = () => { // create unique id for each chat
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for(let i = 0; i < 10; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    id += Date.now();
    return id;
}

const get_chat_by_id = (id) => {
    // return allChats.find(chat => chat.id === id);
    return allChats[id];
}

// ________________________________PREMIUM___________________________________

let clickTimeout = null;

const send_message_to_content = async (action, data = {}) => {
    await chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const message = { action, data }
        chrome.tabs.sendMessage(tabs[0].id, message)
    })
}

smart_circle.addEventListener('click', () => {
    smart_circle.classList.add('active');
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        smart_circle.classList.remove('active');

        send_message_to_content('highlight');
        send_message_to_content('popout', { chat: allChats[currentChatId], maximize: false});

        window.close()
    }, 500)

})

// _________________________________MENU___________________________________

const isAllChatsEmpty = () => {
    const chatIds = Object.keys(allChats);
    return chatIds.length === 0;
}

const isAnyChatEmpty = () => {
    const chatIds = Object.keys(allChats);
    for(let i = 0; i < chatIds.length; i++) {
        const chat = allChats[chatIds[i]];
        // console.log(chat)
        if(!chat.chatHistory) {
            chat.chatHistory = [];
            return chat;
        }
        if(chat.chatHistory.length === 0) return chat;
    }
    return null;
}

const toggleMenu = () => {
    if (menuButton.classList.contains('active')) {
        closeMenu();
    } else {
        render_all_chats();
        openMenu();
    }
}

const isMenuOpen = () => {
    return menuButton.classList.contains('active');
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

    search_input.focus();
}

const create_new_chat = () => {
    // check if any chats are empty, meaning that they are new chats
    const empty_chat = isAnyChatEmpty();
    
    if(empty_chat) {
        currentChatId = empty_chat.id;
        currentChatHistory = allChats[currentChatId].chatHistory;
        lastChatId = currentChatId;
        allChats[currentChatId].timestamp = Date.now();

        load_chat();
        return
    }

    const new_chat = {timestamp: Date.now(), chatHistory: [], title: NEW_CHAT_NAME, id : create_unique_id()};
    // allChats.push(new_chat);
    allChats[new_chat.id] = new_chat;
    currentChatId = new_chat.id;
    currentChatHistory = allChats[currentChatId].chatHistory;
    lastChatId = currentChatId;

    last_response_element = null; // if response is still loading, do not submit query

    load_chat();

    // console.log(allChats)
}

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

const close_all_edit_menus = () => {
    const all_edit_menus = document.querySelectorAll('.edit-menu');
    all_edit_menus.forEach(menu => {
        menu.classList.remove('active');
    })
}

const activateChat = (chat) => {
    if(!chat) return
    lastChatId = chat.id;
    
    chat.classList.add('active');
    const chat_image = chat.querySelector('.chat-image');
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
    deactivateChat(document.getElementById(lastChatId));
}

const create_menu_item = (chat) => {
    const menu_item = document.createElement('div');
    menu_item.classList.add('menu-item');
    menu_item.id = chat.id;

    const chat_image = document.createElement('img');
    chat_image.classList.add('chat-image');
    chat_image.src = '../../../../images/chat.png';

    const chat_text = document.createElement('p');
    chat_text.innerHTML = chat.title;
    chat_text.title = chat.title;

    const chat_dots = document.createElement('button');
    chat_dots.classList.add('chat-dots');

    const dots_image = document.createElement('img');
    dots_image.src = '../../../../images/dots.png';

    chat_dots.appendChild(dots_image);

    const edit_menu = document.createElement('div');
    edit_menu.classList.add('edit-menu');

    const rename_btn = document.createElement('button');
    rename_btn.classList.add('rename-btn');
    const rename_img = document.createElement('img');
    rename_img.src = '../../../../images/rename.png';
    rename_btn.appendChild(rename_img);

    const popout_btn = document.createElement('button');
    popout_btn.classList.add('popout-btn');
    const popout_img = document.createElement('img');
    popout_img.src = '../../../../images/popout.png';
    popout_btn.appendChild(popout_img);

    const delete_btn = document.createElement('button');
    delete_btn.classList.add('delete-btn');
    const delete_img = document.createElement('img');
    delete_img.src = '../../../../images/delete.png';
    delete_btn.appendChild(delete_img);

    edit_menu.appendChild(popout_btn);
    edit_menu.appendChild(rename_btn);
    edit_menu.appendChild(delete_btn);

    menu_item.appendChild(chat_image);
    menu_item.appendChild(chat_text);
    menu_item.appendChild(chat_dots);
    menu_item.appendChild(edit_menu);

    chat_dots.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = edit_menu.classList.contains('active');
        close_all_edit_menus();
        if(!isActive) edit_menu.classList.add('active');
        open_chat();

        deactivateLastChat();
        activateChat(menu_item);
    });

    edit_menu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    
    const start_edit = () => {
        chat_text.contentEditable = true;
        
        // highlight text
        const range = document.createRange();
        range.selectNodeContents(chat_text);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        is_editing = true;
    }

    const stop_edit = () => {
        chat_text.contentEditable = false;
        is_editing = false;
        if(chat_text.innerHTML === '') chat_text.innerHTML = chat.title;
        setTitle(chat_text.innerHTML);
    }

    const open_chat = () => {
        currentChatId = chat.id;
        currentChatHistory = allChats[currentChatId].chatHistory;
        load_chat();

        last_response_element = null; // if response is still loading, do not submit query
    }

    let is_editing = false;
    chat_text.addEventListener('click', (e) => {
        if(is_editing) e.stopPropagation();
    })
    
    // rename chat
    rename_btn.addEventListener('click', (e) => {
        // make chat title editable
        close_all_edit_menus();
        start_edit();

        // change chat menu item to focus
        deactivateLastChat();
        activateChat(menu_item);

        // open chat if not already open
        if(currentChatId !== chat.id) open_chat();
    });

    // popout chat
    popout_btn.addEventListener('click', (e) => {
        console.log('popout chat')
        close_all_edit_menus();

        // send message to content script
        send_message_to_content('popout', { chat , maximize: true});
        window.close();
    })

    // delete chat
    delete_btn.addEventListener('click', (e) => {
        close_all_edit_menus();

        // console.log(chat.chatHistory.length)
        if(chat.title == NEW_CHAT_NAME && chat.chatHistory.length === 0) return
        
        delete allChats[chat.id];

        if(chat.id === currentChatId) {create_new_chat()}
        
        render_all_chats();
    })

    // is_editing = false; when user presses enter or clicks outside of chat_text
    chat_text.addEventListener('blur', (e) => {stop_edit();})
    chat_text.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            stop_edit();
        }
    })

    menu_item.addEventListener('click', () => {
        close_all_edit_menus();
        open_chat();
    })

    return menu_item;
}
menu_section.addEventListener('scroll', (e) => {close_all_edit_menus()})

// sorts all chats by timestamp and returns an array of sorted chats
const sort_chats = () => {
    const chatIds = Object.keys(allChats);
    chatIds.sort((a, b) => allChats[b].timestamp - allChats[a].timestamp);
    return chatIds;
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
    if(isAllChatsEmpty()) create_new_chat();

    // clear all menu items/headers
    for(let i = 0; i < 5; i++) {
        hide_menu_header(i);
        const menu_header = get_menu_header(i);
        const menu_items = menu_header.querySelector('.menu-items');
        menu_items.innerHTML = '';
    }

    const current_date = Date.now();
    // const current_date = new Date();
    // const menu_header = create_menu_header('Today');
    // menu_section.appendChild(menu_header);
    
    // allChats.sort((a, b) => b.timestamp - a.timestamp); // sort by timestamp
    // console.log(allChats)
    const sortedChatIds = sort_chats();
    sortedChatIds.forEach( id => {
        const chat = allChats[id];

        const timestamp = chat.timestamp;

        const menu_item = create_menu_item(chat);

        let header_id = 0;

        if(timestamp > current_date - 86400000) {header_id = 0} // Today 
        else if(timestamp > current_date - 172800000) {header_id = 1} // Yesterday 
        else if(timestamp > current_date - 604800000) {header_id = 2} // Last Week 
        else if(timestamp > current_date - 2628000000) {header_id = 3} // Last Month 
        else {header_id = 4} //Older

        const menu_header = get_menu_header(header_id);
        const menu_items = menu_header.querySelector('.menu-items');
        menu_items.appendChild(menu_item);

        show_menu_header(header_id);
    })

    // menu items
    const menu_chats = document.querySelectorAll('.menu-item');
    menu_chats.forEach(menu_chat => {
        
        menu_chat.addEventListener('click', () => {
            deactivateLastChat();
            activateChat(menu_chat);
            
            // wait for animation to finish before closing menu
            setTimeout(() => {
                closeMenu();
            }, 500)
        })

        // check if chat has same id as last chat activated
        if(menu_chat.id === lastChatId) {
            activateChat(menu_chat);
        }
    })
}

chat_body.addEventListener('click', () =>{
    if(isMenuOpen()) closeMenu();
})

// ___________________________________HEADER___________________________________

// ___________________________________CHAT___________________________________

const create_chat_image = (source) => {
    const image = document.createElement('img')
    image.src = source
    image.className = 'chat-image'
    return image
}

const create_chat_bubble = (role, content, image) => {
    const message_element = document.createElement('div'); 
    const profile_image = document.createElement('img');
    profile_image.className = 'pfp';
    // const message = document.createElement('p');
    const message = document.createElement('msg');

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

    if(image){
        const image_element = create_chat_image(image)
        message.appendChild(image_element)
    }

    return message_element;
}

const create_chat_error = (message) => {
    const error_element = document.createElement('div');
    error_element.className = 'chat-error';
    error_element.innerHTML = message
    return error_element
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

    currentChatHistory.forEach(async chat => {
        try{
            // const chat_element = await create_chat_bubble(chat.role, chat.content);
            // console.log(chat.content[1])
            const chat_element = create_chat_bubble(chat.role, chat.content[0].text, chat.content[1] ? chat.content[1].image_url.url : null);
            chat_body.appendChild(chat_element);
        } catch (e){
            // const chat_error = create_chat_error('Error loading chat');
            const chat_error = create_chat_error(e);
            chat_body.appendChild(chat_error);
        }
    })

    // set chat scroll to bottom
    chat_body.scrollTop = chat_body.scrollHeight;
}

// used when a response is returned
const render_response = (content) => {
    if(last_response_element == null) return

    let message = last_response_element.querySelector('msg');
    message.innerHTML = '';
    const typeAmount = 1 // amount of characters typed per frame 
    let typed = ''; // current message content
    const type_end = " ◉" // end of message content (used to indicate that the message is being typed)
    const loop = setInterval(() => {
        try{
            if(typed === content) {
                message.innerHTML = content;
                clearInterval(loop);
                return
            }
            typed += content.slice(typed.length, typed.length + typeAmount);
            message.innerHTML = typed + type_end;
        } catch (e) {
            console.error(e)
            message.innerHTML = content;
            clearInterval(loop);
        }
    }, 1000 / 120);

    last_response_element = null;
}

const response_loading = async () => {
    const response_element = create_chat_bubble('system', '');
    chat_body.appendChild(response_element);
    
    const message = response_element.querySelector('msg');

    const loading_gif = document.createElement('img');
    loading_gif.className = 'loading-gif';
    loading_gif.src = '../../../../images/typing.gif';
    // loading_gif.src = await chrome.runtime.getURL('images/typing.gif');

    message.appendChild(loading_gif);
    
    chat_body.scrollTop = chat_body.scrollHeight;
    last_response_element = response_element;
}

// add new message to chat history
const update_chat_history = (role = 0, text) => {
    // determine role
    role = role === 0 ? 'user' : 'system';

    let content = [
        {
            type: 'text',
             text
         },
    ]

    currentChatHistory.push({ role, content });

    // update timestamp (last sent message)
    allChats[currentChatId].timestamp = Date.now();
    // allChats[currentChat].timestamp = new Date();
}

// ___________________________________FORM___________________________________


const setTitle = (title) => {
    allChats[currentChatId].title = title;
}

const handleSubmit = async (e) => {
    e.preventDefault()

    if(last_response_element) return // if response is still loading, do not submit query

    const input = form.querySelector('input');
    const query = input.value;
    input.value = '';

    if(query === '') return

    console.log('Submitting query:', query)

    // console.log(allChats[currentChat].title, NEW_CHAT_NAME)
    // console.log(currentChatHistory.length)
    console.log(allChats)
    if(allChats[currentChatId].title === NEW_CHAT_NAME && currentChatHistory.length === 0 ) setTitle(query);
    update_chat_history(0, query);
    // console.log(allChats[currentChat].title, NEW_CHAT_NAME)
    load_chat();
    response_loading();

    // console.log(allChats)
    
    
    // port.postMessage({ 
    //     action: 'queryText', 
    //     chatModel: 0,
    //     chatHistory: currentChatHistory,
    // });
    port.postMessage({ 
        action: 'queryImage', 
        chatModel: 0,
        chatHistory: currentChatHistory,
        imageData: true,
    });
}

const main = async () => {
    menuButton.addEventListener('click', () => {
        toggleMenu()
    })

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

    // message received from background script
    port.onMessage.addListener((msg) => {
        console.log(msg)
        switch(msg.action) {
            case 'queryText':
                // const response_message = msg.data.content.choices[0].message.content;
                const response_message = msg.data.content;
                update_chat_history(1, response_message.html); // add system response to chat history
                render_response(response_message.html); 
                
                break;

            case 'queryImage':
                // const response_message_image = msg.data.content.choices[0].message.content;
                const response_message_image = msg.data.content;

                if(last_response_element){ // if the response element is null then that means the user switched chats before the response was returned
                    update_chat_history(1, response_message_image.html); // add system response to chat history
                    render_response(response_message_image.html); 
                    console.log('Response rendering!')
                } else {
                    console.log('Response NOT rendering!')
                }

            case 'refresh':
                // keeps the service worker actuve
                setTimeout(() => {
                    try{
                        port.postMessage({ action: 'refresh' });
                    } catch(e) {
                        console.error(e)
                    }
                }, 20000)
                break;
            case 'saveChats':
                console.log('Saved allChats')
                break;
            case 'signOut':
                window.location.href = "../../popup.html";
                break;
            default:
                console.log('Invalid action')
        }
    })

    const savedChats = await chrome.storage.local.get(["allChats"])
    
    if(savedChats.allChats) { 
        allChats = savedChats.allChats;
        console.log('_________________________Chats loaded__________________________')
        console.log(allChats)
    }

    // send message to background script
    form.addEventListener('submit', handleSubmit)

    port.postMessage({ action: 'refresh' });
    
    create_new_chat(); // create new chat when user starts the extension


    render_all_chats(); // load elements in menu
    load_chat(); // load chat history

    // When the user leaves the chrome extension save the chat history
    window.addEventListener('blur', async () => {

        // set chrome local storage
        await chrome.storage.local.set(({ allChats })); //save chats locally
        port.postMessage({ action: 'saveChats', allChats}); //save chats to database
        // await chrome.storage.local.set(({ allChats: {} }));
    })

    search_input.focus();

    // ___________________________________TEST___________________________________
    const settingsBtn = document.getElementById('settings');
    settingsBtn.addEventListener('click', async () => {
        // port.postMessage({ action: 'signOut' });
        window.location.href = "../settings/settings.html";
    })
}

main();
