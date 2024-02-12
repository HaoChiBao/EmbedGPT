console.log('Embed GPT')

const makeElementDraggable = (element, dragElement) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    dragElement.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
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

    // __________________________________________PORT FOR SERVICE WORKER__________________________________________
    const port = await chrome.runtime.connect({ name: "content" });
    
    port.onMessage.addListener(async (response) => {
        const execute = await responseHandler(response)
        // console.log(execute)
    });

    port.onDisconnect.addListener(() => {
        console.log('Port disconnected')
    })

    port.postMessage({ action: 'refresh' });

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
        
                    
                    // testing
                    const img = document.createElement('img')
                    img.src = croppedImageData
                    img.className = 'cropped-image-test'
                    document.body.appendChild(img)
        
                    console.log(img)
        
                    break;
        
                case 'refresh':
                    // keeps the service worker actuve
                    setTimeout(() => {
                        port.postMessage({ action: 'refresh' });
                    }, 20000)
                    break;
            }
            
        }

    // __________________________________________HIGHLIGHTER__________________________________________
    let highlight = false;
    let h_start = null // this will turn into {x: 0, y: 0} when the user clicks
    let h_end = null // this will turn into {x: 0, y: 0} when the user releases the mouse
    let h_element = null // this will be the highlight element
    let h_path = [] // this will be the path of the highlight element

    let draw_path = false //represents WHEN the program allows the user to draw

    // represents if the user wants to draw to highlight or drag to highlight
    let pencil_highlight = true
    // pencil_highlight = !pencil_highlight

    const h_bounding_box = { // holds the min and max values of the pencil highlight
        minX: null,
        minY: null,
        maxX: null,
        maxY: null,
    }

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

    const transformHighlightPath= () => {
        draw_path = false
        highlight = false
        highlight_area.style.pointerEvents = 'none'
        highlight_area.style.cursor = 'default'

        console.log('transforming path')
        const MOVE_STEP = 8 // how fast the points move to the corners

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


        // move points to the bounding box
        const loop = setInterval(async () => {

            let count = 0
            let max_length = top_left.length + top_right.length + bottom_left.length + bottom_right.length
            
            if(top_left.length > 0) {
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
            }

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
                if(angle >= Math.PI/4) {
                    clearInterval(loop)
                    console.log('done')
                    await cancel_highlighter()
                    // clearHighlightPath()
                }

            }

        }, 5)
    }

    // creates the highlight element
    const createHighlightElement = (x, y) => {
        const highlightElement = document.createElement('div')
        highlightElement.className = 'highlight-element'
        highlightElement.style.left = x + 'px'
        highlightElement.style.top = y + 'px'
        return highlightElement
    }

    // starts the highlighter
    const start_highlighter = (x, y) => {
        draw_path = true

        if(!pencil_highlight){
            // create the highlight element and append to page
            h_element = createHighlightElement(x, y)
            document.body.appendChild(h_element)
        }

        highlight_area.style.pointerEvents = 'auto'
        highlight_area.style.cursor = 'crosshair'
    }

    const cancel_highlighter = async () => {

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
         
        // remove the highlight element
        if(h_element) await h_element.remove()

        // check if there are any duplicates on the page
        const h_elements = document.querySelectorAll('.highlight-element')
        h_elements.forEach( async (element) => { element.remove() })

        h_element = null
 
        highlight_area.style.pointerEvents = 'none'
        highlight_area.style.cursor = 'default'
        // clearHighlightPath()
    }

    // ends the highlighter 
    const end_highlighter = async () => {
        const dimensions = {
            x: h_start.x,
            y: h_start.y,
            width: h_end.x - h_start.x,
            height: h_end.y - h_start.y
        }
        
        if(pencil_highlight){
            dimensions.x = h_bounding_box.minX
            dimensions.y = h_bounding_box.minY
            dimensions.width = h_bounding_box.maxX - h_bounding_box.minX
            dimensions.height = h_bounding_box.maxY - h_bounding_box.minY
        }

        //await cancel_highlighter()

        if (pencil_highlight) transformHighlightPath()
        else await cancel_highlighter()

        // execute the capture action
        setTimeout(() => { // delay to allow the highlight element to be removed
            port.postMessage({ action: 'capture', dimensions: dimensions });
        }, 100)
    }
    
    const init_highlighter = () => {
    

        window.addEventListener('resize', () => {
            highlight_area.width = window.innerWidth
            highlight_area.height = window.innerHeight
        })

        // highlight event listeners
        window.addEventListener('mousedown', async (e) => {
            if(highlight) {
                // where the highlight starts
                h_start = { x: e.clientX, y: e.clientY }
                start_highlighter(h_start.x, h_start.y)
            }
        })

        window.addEventListener('mousemove', async (e) => {
            if(highlight && draw_path) {
                e.preventDefault()
                // where the highlight ends
                h_end = { x: e.clientX, y: e.clientY }

                // push the path to the highlight element
                h_path.push({ x: h_end.x, y: h_end.y })

                // update the highlight element
                if(pencil_highlight){
                    // update the line path
                    await drawHighlightPath([h_path])

                    // check if the current x or y is less than the min or greater than the max
                    if(h_end.x < h_bounding_box.minX || h_bounding_box.minX == null) h_bounding_box.minX = h_end.x
                    if(h_end.y < h_bounding_box.minY || h_bounding_box.minY == null ) h_bounding_box.minY = h_end.y
                    if(h_end.x > h_bounding_box.maxX || h_bounding_box.maxX == null) h_bounding_box.maxX = h_end.x
                    if(h_end.y > h_bounding_box.maxY || h_bounding_box.maxY == null) h_bounding_box.maxY = h_end.y

                } else {
                    h_element.style.width = (h_end.x - h_start.x) + 'px'
                    h_element.style.height = (h_end.y - h_start.y) + 'px'

                    clearHighlightPath()
                    await drawHighlightLogo(h_end.x, h_end.y)
                }
            }
        })

        window.addEventListener('mouseup', async (e) => {
            if(e.button === 2) { // if the user right clicks while highlighting, cancel the highlighter
                await cancel_highlighter()
                clearHighlightPath()
            }
            
            if(highlight && draw_path) {
                h_end = { x: e.clientX, y: e.clientY }
                await end_highlighter()
            }
        })
        
        // end highlighter if the user clicks outside the window
        window.addEventListener('blur', async (e) => {
            await cancel_highlighter()
            clearHighlightPath()
        })
        
        window.addEventListener('keyup', async (e) => {
            if(e.key === 'Escape') {
                await cancel_highlighter()
                clearHighlightPath()
            }
        })
    }

    init_highlighter()

    // return

    // testing ______________________________________________

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
    testHighlight.onclick = () => {
        highlight = true
    }

    const toggleHighlight = document.createElement('button')
    toggleHighlight.textContent = 'Toggle Highlight'
    toggleHighlight.onclick = () => {
        pencil_highlight = !pencil_highlight
    }
    
    testMenu.appendChild(moveAround)
    testMenu.appendChild(testInput)
    testMenu.appendChild(testButton)
    testMenu.appendChild(testHighlight)
    testMenu.appendChild(toggleHighlight)
    document.body.appendChild(testMenu)
    makeElementDraggable(testMenu, moveAround)

}
main()