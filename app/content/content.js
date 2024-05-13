console.log('Embed GPT')

const makeElementDraggable = (element, dragElement) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    dragElement.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopPropagation();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopPropagation();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const moveY = element.offsetTop - pos2
        const moveX = element.offsetLeft - pos1

        if(moveY < 30 || moveY > window.innerHeight) return
        if(moveX < 0 || moveX > window.innerWidth) return   

        element.style.top = `${moveY}px`;
        element.style.left = `${moveX}px`;
        element.classList.add('dragging')
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        element.classList.remove('dragging')
    }

    window.addEventListener('resize',()=>{
        if(element.offsetTop > window.innerHeight) element.style.top = `${window.innerHeight - 100}px`
        if(element.offsetTop < 30) element.style.top = `30px`
        
        if(element.offsetLeft > window.innerWidth) element.style.left = `${window.innerWidth - 100}px`
        if(element.offsetLeft < 0) element.style.left = `0px`
    })
}

const cropDataUrl = async (dataUrl, dimensions) => {
    // return promise
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.src = dataUrl

        
        img.onload = () => {
            const img_width = img.width
            const img_height = img.height
            const original_width = window.innerWidth
            const original_height = window.innerHeight

            // calculate the ratio of the original image to the window
            const ratio = img_width / original_width

            canvas.width = dimensions.width * ratio
            canvas.height = dimensions.height * ratio
            // ctx.drawImage(img, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 0, 0, dimensions.width, dimensions.height)
            ctx.drawImage(img, dimensions.x * ratio, dimensions.y * ratio, dimensions.width * ratio, dimensions.height * ratio, 0, 0, dimensions.width * ratio, dimensions.height* ratio)
            // document.body.appendChild(canvas)
            const dataUrl = canvas.toDataURL('image/png')
            resolve(dataUrl)
        }

    })

}

// initialize data and event listeners
const main = async () => {

    // content chat element related variables
    let imagePreview_imageData = null
    let AUTOFILL_TEXT = 'What do you see?'

    // chat variables
    const NEW_CHAT_NAME = 'New Chat';
    // let allChats = []
    let allChats = {}
    // let currentChat = 0
    let currentChatId = null
    let currentChatHistory = []

    // __________________________________________PORT FOR SERVICE WORKER__________________________________________
    let port = await chrome.runtime.connect({ name: "content" });
    
    port.onMessage.addListener(async (response) => {
        const execute = await responseHandler(response)
        // console.log(execute)
    });

    port.onDisconnect.addListener(() => {
        console.log('Port disconnected')
        port = chrome.runtime.connect({ name: "content" });
    })

    port.postMessage({ action: 'refresh' }); //constantly refreshes the service worker

    // port for popup to communicate with content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const { action, data } = request
        try{
            switch(action){
                case 'highlight':
                    console.log('highlighting')
                    start_highlighter()
                    break;
                case 'popout':
                    // console.log('popout')
                    
                    const chat = data.chat
                    currentChatId = chat.id
                    currentChatHistory = chat.chatHistory
                    allChats[currentChatId] = chat

                    load_chat()

                    open_chat(false)
                    // maximize_chat()

                    break;
                default:
                    console.log(request)
            }

            // sendResponse({status: 'received'})

        } catch(e) {
            console.error(e)
            // sendResponse({status: 'error', error: e})
        }
    })

    // __________________________________________RESPONSE HANDLER__________________________________________
    const responseHandler = async (response) => {
        // console.log(response)
        if(response.error) {
            console.error(response.error)
            return
        }
    
        const action = response.action
        const data = response.data
        switch(action) {
            case 'capture':
                
                const dataUrl = data.dataUrl
                const dimensions = data.dimensions
    
                const croppedImageData = await cropDataUrl(dataUrl, dimensions)
                save_imagePreview_imageData(croppedImageData)
                open_chat()
                
                // save image to clipboard
                const imageData = await fetch(croppedImageData)
                const blob = await imageData.blob()
                
                try{
                    navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]).then(() => {
                        console.log('Image copied to clipboard')
                    })
                } catch (e) {
                    console.error(e)
                }

                break;

            case 'queryText':
                const response_message = data.content.choices[0].message.content;
                await update_chat_history(1, response_message); // add system response to chat history
                render_response(response_message); // display system response (with animation) in chat
    
                console.log(currentChatHistory)
                break;

            case 'queryImage':
                console.log(data)
                const response_message_image = data.content.choices[0].message.content;
                await update_chat_history(1, response_message_image); // add system response to chat history
                render_response(response_message_image); // display system response (with animation) in chat
                // console.log(currentChatHistory)
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
                break;
            default:
                console.log(action)
        }
        
    }

    
    // __________________________________________GRADIENT CANVAS__________________________________________
    const gradient_outer = document.createElement('div')
    gradient_outer.className = 'gradient-outer'
    // gradient_outer.classList.add('active')
    
    const gradient_area = document.createElement('canvas')
    gradient_area.className = 'gradient-area'
    gradient_area.width = 32
    gradient_area.height = 32
    
    gradient_outer.appendChild(gradient_area)
    document.body.appendChild(gradient_outer)

    const context = gradient_area.getContext('2d')
    let time = 0;

    const color = function (x, y, r, g, b) {
    context.fillStyle = `rgb(${r}, ${g}, ${b})`
    context.fillRect(x, y, 10, 10);
    }
    const R = function (x, y, time) {
    return (Math.floor(192 + 64 * Math.cos((x * x - y * y) / 300 + time)));
    }

    const G = function (x, y, time) {
    return (Math.floor(192 + 64 * Math.sin((x * x * Math.cos(time / 4) + y * y * Math.sin(time / 3)) / 300)));
    }

    const B = function (x, y, time) {
    return (Math.floor(192 + 64 * Math.sin(5 * Math.sin(time / 9) + ((x - 100) * (x - 100) + (y - 100) * (y - 100)) / 1100)));
    }

    const startAnimation = function () {
    for (x = 0; x <= 30; x++) {
        for (y = 0; y <= 30; y++) {
            color(x, y, R(x, y, time), G(x, y, time), B(x, y, time));
        }
    }
    time = time + 0.03;
    window.requestAnimationFrame(startAnimation);
    }

    startAnimation();

    // __________________________________________HIGHLIGHTER__________________________________________
    let highlight = false;
    let h_start = null // this will turn into {x: 0, y: 0} when the user clicks
    let h_end = null // this will turn into {x: 0, y: 0} when the user releases the mouse
    let draw_path = false //represents WHEN the program allows the user to draw
    
    
    // represents if the user wants to draw to highlight or drag to highlight
    let h_path = [] // this will be the path of the highlight element
    let h_query_element = null

    const h_bounding_box = { // holds the min and max values of the pencil highlight
        minX: null,
        minY: null,
        maxX: null,
        maxY: null,
    }

    const h_MIN_BOXSIZE = 50 // the minimum size of the bounding box (in pixels)

    const highlight_area = document.createElement('canvas')
    highlight_area.className = 'highlight-area'
    highlight_area.width = window.innerWidth
    highlight_area.height = window.innerHeight
    document.body.appendChild(highlight_area)

    const ctx = highlight_area.getContext('2d')
    
    // draws the highlight path
    const drawHighlightPath = async (paths, logo = {x: h_end.x, y: h_end.y}) => {

        ctx.clearRect(0, 0, highlight_area.width, highlight_area.height)
        ctx.beginPath()
        
        ctx.lineWidth = 7
        ctx.lineCap = 'round'

        const gradient_colours = [
            '#715AFF',
            '#5887FF',
            '#8DADFF',
            '#5887FF',
            '#715AFF',
            '#5887FF',
            '#8DADFF',
            '#5887FF',
            '#715AFF',
            '#5887FF',
            '#8DADFF',
        ]

        // Create a linear gradient
        const gradient = ctx.createLinearGradient(0,0, window.innerWidth, window.innerHeight);

        gradient_colours.forEach((colour, index) => {
            gradient.addColorStop(index/gradient_colours.length, colour)
        })

        // Set the gradient as the stroke style
        ctx.strokeStyle = gradient;
        
        // ctx.moveTo(h_path[0].x, h_path[0].y)
        // h_path.forEach((point, index) => {
        //     // if(index%2 === 0) return
        //     ctx.lineTo(point.x, point.y)
        // })

        paths.forEach((path) => {
            if(path.length === 0) return

            ctx.moveTo(path[0].x, path[0].y)
            path.forEach((point, index) => {
                // if(index%2 === 0) return
                ctx.lineTo(point.x, point.y)
            })
            ctx.stroke()
        })
        
        await drawHighlightLogo(logo.x, logo.y)
    }

    const drawHighlightLogo = async (x, y) => {
        const logo = new Image()
        logo.src = await chrome.runtime.getURL('images/stars.png')
        ctx.drawImage(logo, x + 5, y + 5, 25, 25)
    }

    // clears the highlight path
    const clearHighlightPath = () => {
        ctx.clearRect(0, 0, highlight_area.width, highlight_area.height)
    }

    let loop = null
    // transforms highlight path into 4 corners
    const transformHighlightPath = () => {
        draw_path = false
        highlight = false
        highlight_area.style.pointerEvents = 'none'
        highlight_area.style.cursor = 'default'

        console.log('transforming path')
        // const MOVE_STEP = 6 // how fast the points move to the corners
        const MOVE_STEP = 10 // how fast the points move to the corners

        const ANGLE_STEP = Math.PI/100 // how fast the angle changes
        let angle = 0

        const BORDER_RADIUS = 20 // the radius of the border

        // stores the points that are closest to the corners
        const top_left = []
        const top_right = []
        const bottom_left = []
        const bottom_right = []

        // divide the points into the corners
        h_path.forEach((point, index) => {
            const diffMinX = Math.abs(h_bounding_box.minX - point.x)
            const diffMinY = Math.abs(h_bounding_box.minY - point.y)
            const diffMaxX = Math.abs(h_bounding_box.maxX - point.x)
            const diffMaxY = Math.abs(h_bounding_box.maxY - point.y)

            // take the smallest difference
            const smallest_x_distance = Math.min(diffMinX, diffMaxX)
            const smallest_y_distance = Math.min(diffMinY, diffMaxY)

            if( smallest_x_distance === diffMinX) {
                if (smallest_y_distance === diffMinY){
                    top_left.push(point)
                } else {
                    bottom_left.push(point)
                }
            } else {
                if (smallest_y_distance === diffMinY){
                    top_right.push(point)
                } else {
                    bottom_right.push(point)
                }
            }
        })

        clearInterval(loop)
        // move points to the bounding box
        loop = setInterval(async () => {

            // check if the differeence between the h_bounding_box min and max is greater than the minimum box size
            if(Math.abs(h_bounding_box.maxX - h_bounding_box.minX) < h_MIN_BOXSIZE){
                // increase the size of the bounding box
                const diff = h_MIN_BOXSIZE - Math.abs(h_bounding_box.maxX - h_bounding_box.minX)
                h_bounding_box.minX -= diff/2
                h_bounding_box.maxX += diff/2
            }

            if(Math.abs(h_bounding_box.maxY - h_bounding_box.minY) < h_MIN_BOXSIZE) {
                const diff = h_MIN_BOXSIZE - Math.abs(h_bounding_box.maxY - h_bounding_box.minY)
                h_bounding_box.minY -= diff/2
                h_bounding_box.maxY += diff/2
            }

            let count = 0
            let max_length = top_left.length + top_right.length + bottom_left.length + bottom_right.length
            
            top_left.forEach((point, index) => {
                if(point.x > h_bounding_box.minX) point.x -= MOVE_STEP
                else{ point.x = h_bounding_box.minX; count++}

                if(point.y > h_bounding_box.minY) point.y -= MOVE_STEP
                else {point.y = h_bounding_box.minY; count++}
            })

            top_right.forEach((point, index) => {
                if(point.x < h_bounding_box.maxX) point.x += MOVE_STEP
                else {point.x = h_bounding_box.maxX; count++}

                if(point.y > h_bounding_box.minY) point.y -= MOVE_STEP
                else {point.y = h_bounding_box.minY; count++}
            })

            bottom_left.forEach((point, index) => {
                if(point.x > h_bounding_box.minX) point.x -= MOVE_STEP
                else {point.x = h_bounding_box.minX; count++}

                if(point.y < h_bounding_box.maxY) point.y += MOVE_STEP
                else {point.y = h_bounding_box.maxY; count++}
            })

            bottom_right.forEach((point, index) => {
                if(point.x < h_bounding_box.maxX) point.x += MOVE_STEP
                else {point.x = h_bounding_box.maxX; count++}

                if(point.y < h_bounding_box.maxY) point.y += MOVE_STEP
                else {point.y = h_bounding_box.maxY; count++}
            })

            const logo = {x: h_bounding_box.maxX, y: h_bounding_box.maxY}
            if(bottom_right.length > 0) {
                logo.x = bottom_right[0].x
                logo.y = bottom_right[0].y
            }

            drawHighlightPath([top_left, top_right, bottom_left, bottom_right], logo)

            if(count === max_length * 2) {
                if(angle >= Math.PI/4) angle = Math.PI/4

                // draw 1/4 circles in the corners
                clearHighlightPath()
                
                const drawArc = (x, y, radius, startAngle, endAngle, counterClockwise = false) => {
                    ctx.beginPath()
                    ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise)
                    ctx.stroke()
                }
                
                for(let i = 0; i < 4; i++) {
                    if(i == 0){ //top left corner
                        const startAngle = Math.PI + Math.PI/4
                        const endAngle1 = startAngle + angle
                        const endAngle2 = startAngle - angle

                        drawArc(h_bounding_box.minX + BORDER_RADIUS, h_bounding_box.minY + BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle1)
                        drawArc(h_bounding_box.minX + BORDER_RADIUS, h_bounding_box.minY + BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle2, true)
                       
                    } else if (i == 1) { //top right corner
                        const startAngle = 3 * Math.PI / 2 + Math.PI/4
                        const endAngle1 = startAngle + angle
                        const endAngle2 = startAngle - angle

                        drawArc(h_bounding_box.maxX - BORDER_RADIUS, h_bounding_box.minY + BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle1)
                        drawArc(h_bounding_box.maxX - BORDER_RADIUS, h_bounding_box.minY + BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle2, true)

                    } else if (i == 2) { //bottom left corner
                        const startAngle = Math.PI/2 + Math.PI/4
                        const endAngle1 = startAngle + angle
                        const endAngle2 = startAngle - angle

                        drawArc(h_bounding_box.minX + BORDER_RADIUS, h_bounding_box.maxY - BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle1)
                        drawArc(h_bounding_box.minX + BORDER_RADIUS, h_bounding_box.maxY - BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle2, true)
                        
                    }
                    else { //bottom right corner
                        const startAngle = 2 * Math.PI + Math.PI/4
                        const endAngle1 = startAngle + angle
                        const endAngle2 = startAngle - angle
                        
                        drawArc(h_bounding_box.maxX- BORDER_RADIUS, h_bounding_box.maxY- BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle1)
                        drawArc(h_bounding_box.maxX- BORDER_RADIUS, h_bounding_box.maxY- BORDER_RADIUS, BORDER_RADIUS, startAngle, endAngle2, true)
                    }
                    // ctx.stroke()
                }

                angle += ANGLE_STEP

                // end the loop
                if(angle >= Math.PI/4) {
                    clearInterval(loop)

                    // capture the image
                    const dimensions = {
                        x: h_bounding_box.minX,
                        y: h_bounding_box.minY,
                        width: h_bounding_box.maxX - h_bounding_box.minX,
                        height: h_bounding_box.maxY - h_bounding_box.minY
                    }
                    port.postMessage({ action: 'capture', dimensions: dimensions });
                    
                    // allow user to highlight again
                    start_highlighter()

                    // let query_x = h_bounding_box.minX - 200
                    // if (query_x < 0) query_x = 20

                    // const query_y = h_bounding_box.minY + (h_bounding_box.maxY - h_bounding_box.minY) / 2
                    // h_query_element = createQueryElement(query_x, query_y)
                    // document.body.appendChild(h_query_element)

                    // setTimeout(() => {
                    //     h_query_element.style.width = '250px'
                    //     h_query_element.style.opacity = 1
                    // }, 100)

                    // await stop_highlighter()
                }

            }

        // }, 5)
        }, 1)
    }

    // creates the query element (highlighter element that allows the user to type in a query)
    const createQueryElement = (x, y) => {
        const queryElement = document.createElement('input')
        queryElement.className = 'highlight-query'
        queryElement.placeholder = 'what do you see?'
        queryElement.spellcheck = false

        queryElement.style.left = x + 'px'
        queryElement.style.top = y + 'px'
        queryElement.style.opacity = 0
        queryElement.width = '0px'
        return queryElement
    }

    // removes the query element from DOM
    const clearHighlightQuery = () => {
        if(h_query_element) h_query_element.remove()
    }

    // starts the highlighter
    const start_highlighter = async () => {
        // draw_path = true
        highlight = true
        highlight_area.style.pointerEvents = 'auto'
        highlight_area.style.cursor = 'crosshair'

        gradient_outer.classList.add('active')

        // pause all videos 
        const videos = document.querySelectorAll('video')
        videos.forEach((video) => {
            try{
                video.pause()
            } catch(e) {
                console.error(e)
            }
        })
    }

    // stops highlighter drawing
    const stop_highlighter = async () => {

        // clear the highlight variables
        highlight = false

        h_start = null
        h_end = null
        h_path = []

        h_bounding_box.minX = null
        h_bounding_box.minY = null
        h_bounding_box.maxX = null
        h_bounding_box.maxY = null

        draw_path = false
 
        highlight_area.style.pointerEvents = 'none'
        highlight_area.style.cursor = 'default'
        // clearHighlightPath()

    }

    // close the highlighter
    const close_highlighter = async () => {
        await stop_highlighter()
        clearHighlightPath()
        clearHighlightQuery()

        gradient_outer.classList.remove('active')
    }

    const reset_highlighter = async () => {
        await stop_highlighter()
        start_highlighter()
        clearHighlightPath()
        clearHighlightQuery()
    }

    // when the user finishes highlighting 
    const end_highlighter = async () => {

        // animates the highlighter path to the corners
        transformHighlightPath()
    }
    
    const init_highlighter = () => {
    

        window.addEventListener('resize', async () => {
            highlight_area.width = window.innerWidth
            highlight_area.height = window.innerHeight
            await close_highlighter()
        })

        // highlight event listeners
        window.addEventListener('mousedown', async (e) => {
            if(highlight) {
                await reset_highlighter()
                // where the highlight starts
                h_start = { x: e.clientX, y: e.clientY }
                draw_path = true
            }
        })

        window.addEventListener('mousemove', async (e) => {
            if(highlight && draw_path) {
                e.preventDefault()
                // where the highlight ends
                h_end = { x: e.clientX, y: e.clientY }

                // push the path to the highlight element
                h_path.push({ x: h_end.x, y: h_end.y })

                // update the line path
                await drawHighlightPath([h_path])

                // check if the current x or y is less than the min or greater than the max
                if(h_end.x < h_bounding_box.minX || h_bounding_box.minX == null) h_bounding_box.minX = h_end.x
                if(h_end.y < h_bounding_box.minY || h_bounding_box.minY == null ) h_bounding_box.minY = h_end.y
                if(h_end.x > h_bounding_box.maxX || h_bounding_box.maxX == null) h_bounding_box.maxX = h_end.x
                if(h_end.y > h_bounding_box.maxY || h_bounding_box.maxY == null) h_bounding_box.maxY = h_end.y

                
            }
        })

        window.addEventListener('mouseup', async (e) => {
            /* cancel the highlighter if: 
                1. the user right-clicks
                2. the user only clicks once (DOESN'T DRAW A PATH)
            */

            if(e.button === 2 || h_path.length <= 2) { 
                await close_highlighter()
            }  
            
            else if(highlight && draw_path) {
                h_end = { x: e.clientX, y: e.clientY }
                await end_highlighter()
            }
        })
        
        // end highlighter if the user clicks outside the window
        window.addEventListener('blur', async (e) => {
            await close_highlighter()
        })
        
        window.addEventListener('keyup', async (e) => {
            if(e.key === 'Escape') {
                await close_highlighter()
            }
        })
    }

    init_highlighter()

    
    // __________________________________________CHAT__________________________________________
    const create_unique_id = () => { // create unique id for each chat
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for(let i = 0; i < 10; i++) {
            id += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        id += Date.now();
        return id;
    }

    const setTitle = (title) => {
        allChats[currentChatId].title = title;
    }

    const isAllChatsEmpty = () => {
        const chatIds = Object.keys(allChats);
        return chatIds.length === 0;
    }
    
    const isAnyChatEmpty = () => {
        const chatIds = Object.keys(allChats);
        for(let i = 0; i < chatIds.length; i++) {
            const chat = allChats[chatIds[i]];
            // console.log(chat)
            if(chat.chatHistory.length === 0) return chat;
        }
        return null;
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
        allChats[new_chat.id] = new_chat;
        currentChatId = new_chat.id;
        currentChatHistory = allChats[currentChatId].chatHistory;
        lastChatId = currentChatId;

        load_chat();
    }

    const create_chat_image = (source) => {
        const image = document.createElement('img')
        image.src = source
        image.className = 'chat-image'
        return image
    }

    const create_chat_bubble = async (role, content, image) => {
        const message_element = document.createElement('div'); 
        const profile_image = document.createElement('img');
        profile_image.className = 'pfp';
        const message = document.createElement('p');
    
        if(role === 'user' || role === 0) {
            message_element.classList.add('user-chat');
            // profile_image.src = '../../../../images/profile.png';
            profile_image.src = await chrome.runtime.getURL('images/profile.png');
        } else {
            message_element.classList.add('system-chat');
            // profile_image.src = '../../../../images/stars.png';
            profile_image.src = await chrome.runtime.getURL('images/stars.png');
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
                const chat_element = await create_chat_bubble(chat.role, chat.content[0].text, chat.content[1] ? chat.content[1].image_url.url : null);
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
        }, 1000 / 120);
    
        last_response_element = null;
    }
    
    const response_loading = async () => {
        const response_element = await create_chat_bubble('system', '');
        chat_body.appendChild(response_element);
        
        const message = response_element.querySelector('p');
    
        const loading_gif = document.createElement('img');
        loading_gif.classList.add('loading-gif');
        // loading_gif.src = '../../../../images/typing.gif';
        loading_gif.src = await chrome.runtime.getURL('images/typing.gif');
    
        message.appendChild(loading_gif);
        
        chat_body.scrollTop = chat_body.scrollHeight;
        last_response_element = response_element;
    }
    
    const reset_imagePreview_imageData = () => {
        imagePreview_imageData = null;
        image_preview_img.src = ''
        image_preview.style.display = 'none'
    }

    const save_imagePreview_imageData = (dataUrl) => {
        imagePreview_imageData = dataUrl
        image_preview_img.src = dataUrl
        image_preview.style.display = 'block'
    }

   
   const update_chat_history = async (role = 0, text) => {
        role = role === 0 ? 'user' : 'system';
        let content = [
           {
               type: 'text',
                text
            },
        ]

        // console.log(imagePreview_imageData)
        
        if(imagePreview_imageData && role === 'user') {
            content.push({
                type: 'image_url',
                image_url: {
                    url: imagePreview_imageData
                }
            })
        }

        reset_imagePreview_imageData()
        
        currentChatHistory.push({ role, content });
        allChats[currentChatId].timestamp = Date.now();

        await save_content_chat()
        // console.log(currentChatHistory)
    }

    const save_content_chat = async () => {
        // load all chats saved
        const saved_chats = await chrome.storage.local.get('allChats')
        if(!saved_chats.allChats) saved_chats.allChats = {}

        // check if this is a unique chat
        const saved_chat = saved_chats.allChats[currentChatId]
        if(saved_chat) {
            // replace the chat with the new chat
            saved_chats.allChats[currentChatId] = allChats[currentChatId]
        }
        else {saved_chats.allChats[currentChatId] = allChats[currentChatId]}
        // save the chat
        await chrome.storage.local.set({ allChats: saved_chats.allChats });
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
        if(allChats[currentChatId].title === NEW_CHAT_NAME && currentChatHistory.length === 0 ) setTitle(query);
        await update_chat_history(0, query);
        // console.log(allChats[currentChat].title, NEW_CHAT_NAME)
        load_chat();
        await response_loading();
        
        maximize_chat()
        port.postMessage({ 
            // action: 'queryText', 
            action: 'queryImage', 
            chatModel: 0,
            chatHistory: currentChatHistory,
            imageData: true
        });
    }

    // _________________Content Chat Specific Functions____________________
    const maximize_chat = () => {
        chat.classList.remove('minimized')
    }
    const minimize_chat = () => {
        chat.classList.add('minimized')
    }
    const toggle_minimize = () => {
        chat.classList.toggle('minimized')
    }

    const close_chat = () => {
        chat.classList.add('closed')
        setTimeout(() => {
            chat.style.top = ''
            chat.style.left = '50%'
            minimize_chat()
            // setTimeout(() => {open_chat()},500)
        },500)
    }
    const open_chat = (autofill = true) => {
        chat.classList.remove('closed')
        const chat_input = chat.querySelector('input')
        chat_input.value = ''
        if(autofill) chat_input.value = AUTOFILL_TEXT
        
        // highight input text
        chat_input.select()

        chat_input.focus()
    }

    // __________________________________________CHAT UI__________________________________________
    const createContentChat = async () => {
        const content_chat = document.createElement('div')
        content_chat.className = 'content-chat-body'
        content_chat.classList.add('minimized') //start minimized
        content_chat.classList.add('closed') //start closed

        content_chat.addEventListener('mousedown', e => e.stopPropagation())
        // content_chat.addEventListener('mouseup', e => e.stopPropagation())
        // content_chat.addEventListener('mousemove', e => e.stopPropagation())

        // top part of chat
        const top = document.createElement('div')
        top.className = 'content-chat-top'

        const top_bar = document.createElement('div')
        top_bar.className = 'content-chat-top-bar'
        top.appendChild(top_bar)

        const top_buttons = document.createElement('div')
        top_buttons.className = 'content-chat-top-buttons'
        top.appendChild(top_buttons)

        const minimize = document.createElement('button')
        minimize.className = 'minimize'
        minimize.addEventListener('click', toggle_minimize)
        // minimize.innerHTML = '-'
        
        const close = document.createElement('button')
        close.className = 'close'
        close.addEventListener('click', close_chat)
        // close.innerHTML = 'x'


        top_buttons.appendChild(minimize)
        top_buttons.appendChild(close)

        // chat boy
        const body = document.createElement('section')
        body.className = 'chat-body'

        const empty_chat = document.createElement('div')
        empty_chat.className = 'empty-chat'
        empty_chat.innerHTML = 'start a conversation...'

        body.appendChild(empty_chat)

        // chat search form
        const search = document.createElement('form')
        search.className = 'chat-search'

        const search_input = document.createElement('input')
        search_input.type = 'text'
        search_input.placeholder = 'enter prompt here:'

        // when user clicks on input it will highlight the text
        // search_input.addEventListener('click', e => {
        //     search_input.select()
        // })

        const search_button = document.createElement('button')
        const search_icon = document.createElement('img')
        search_icon.src = await chrome.runtime.getURL('images/stars.png')

        search_button.appendChild(search_icon)

        // const preview_element = document.createElement('div')
        const image_preview = document.createElement('div')
        image_preview.className = 'image-preview'
        image_preview.style.display = 'none'

        const img_element = document.createElement('img')
        img_element.className = 'highlight-image-preview'
        // img_element.src = await chrome.runtime.getURL('images/test.png')
        img_element.alt = 'highlight image preview'

        const delete_image = document.createElement('button')
        delete_image.className = 'delete-button'

        const close_image = document.createElement('img')
        close_image.src = await chrome.runtime.getURL('images/close.png')
        close_image.className = 'close-image'
        delete_image.appendChild(close_image)

        delete_image.addEventListener('click', e => {
            /*
                HEY FUTURE JAMES
                For some reason all form elements are connected to the same event listener
                so when you click on the delete button it also triggers the form submit event

                but when I submit the form it also triggers the delete button event
                weird
            */
            // e.stopPropagation()
            e.preventDefault()
            reset_imagePreview_imageData()
        })


        image_preview.appendChild(delete_image)
        image_preview.appendChild(img_element)

        search.appendChild(image_preview)
        search.appendChild(search_input)
        search.appendChild(search_button)

        content_chat.appendChild(top)
        content_chat.appendChild(body)
        content_chat.appendChild(search)

        // search.addEventListener('submit', handleSubmit)
        search_input.addEventListener('keydown', (e) => {
            if(event.key === 'Enter') handleSubmit(e)
        })
        search_button.addEventListener('click', handleSubmit)

        return content_chat
    }

    // chat variables
    const chat = await createContentChat()
    const chat_body = chat.querySelector('.chat-body')
    const top = chat.querySelector('.content-chat-top')
    const form = chat.querySelector('.chat-search')

    const image_preview = chat.querySelector('.image-preview')
    const image_preview_img = image_preview.querySelector('.highlight-image-preview')
    

    makeElementDraggable(chat, top)
    document.body.appendChild(chat)

    create_new_chat()


    //______________________________________________ TESTING ______________________________________________
    return
    const moveAround = document.createElement('div')
    moveAround.className = 'move-around'
    
    const testMenu = document.createElement('div')
    testMenu.className = 'test-menu'
    
    const testButton = document.createElement('button')
    testButton.textContent = 'Test'
    testButton.onclick = async () => {
        
        const inputVal = testInput.value

        // send message to background
        port.postMessage({ action: inputVal });

    }
    
    const testInput = document.createElement('input')
    testInput.type = 'text'
    testInput.placeholder = 'Test'

    const testHighlight = document.createElement('button')
    testHighlight.textContent = 'Highlight'
    testHighlight.onclick = async () => {
        // this will begin the highlighter
        // await close_highlighter()
        start_highlighter()
        // highlight = true
        // highlight_area.style.pointerEvents = 'auto'
        // highlight_area.style.cursor = 'crosshair'

        // gradient_outer.classList.add('active')
    }
    
    testMenu.appendChild(moveAround)
    testMenu.appendChild(testInput)
    testMenu.appendChild(testButton)
    testMenu.appendChild(testHighlight)
    document.body.appendChild(testMenu)
    makeElementDraggable(testMenu, moveAround)
}
main()
