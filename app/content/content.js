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
            canvas.width = dimensions.width
            canvas.height = dimensions.height
            // ctx.drawImage(img, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 0, 0, dimensions.width, dimensions.height)
            ctx.drawImage(img, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 0, 0, dimensions.width, dimensions.height)
            // document.body.appendChild(canvas)
            const dataUrl = canvas.toDataURL('image/png')
            resolve(dataUrl)
        }

    })

}

const responseHandler = async (response) => {
    console.log(response)
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
    }
    
}


// initialize data and event listeners
const main = async () => {

    // __________________________________________PORT FOR SERVICE WORKER__________________________________________
    const port = await chrome.runtime.connect({ name: "content" });
    
    port.onMessage.addListener(async (response) => {
        const execute = await responseHandler(response)
        // console.log(execute)
    });

    // __________________________________________HIGHLIGHTER__________________________________________
    let highlight = false;
    let h_start = null // this will turn into {x: 0, y: 0} when the user clicks
    let h_end = null // this will turn into {x: 0, y: 0} when the user releases the mouse
    let h_element = null // this will be the highlight element

    
    const createHighlightElement = (x, y) => {
        const highlightElement = document.createElement('div')
        highlightElement.className = 'highlight-element'
        highlightElement.style.left = x + 'px'
        highlightElement.style.top = y + 'px'
        return highlightElement
    }

    const start_highlighter = (x, y) => {
        // create the highlight element and append to page
        h_element = createHighlightElement(x, y)
        document.body.appendChild(h_element)
    }

    const end_highlighter = async () => {
        const dimensions = {
            x: h_start.x,
            y: h_start.y,
            width: h_end.x - h_start.x,
            height: h_end.y - h_start.y
        }
        // clear the highlight variables
        highlight = false
        h_start = null
        h_end = null
        
        await h_element.remove()
        h_element = null

        // execute the capture action
        setTimeout(() => { // delay to allow the highlight element to be removed
            port.postMessage({ action: 'capture', dimensions: dimensions });
        }, 100)
    }
    
    const init_highlighter = () => {
    
        // highlight event listeners
        window.addEventListener('mousedown', (e) => {
            if(highlight) {
                // where the highlight starts
                h_start = { x: e.clientX, y: e.clientY }
                start_highlighter(h_start.x, h_start.y)
            }
        })

        window.addEventListener('mousemove', (e) => {
            if(h_element && highlight) {
                e.preventDefault()
                // where the highlight ends
                h_end = { x: e.clientX, y: e.clientY }

                // update the highlight element
                h_element.style.width = (h_end.x - h_start.x) + 'px'
                h_element.style.height = (h_end.y - h_start.y) + 'px'
            }
        })

        window.addEventListener('mouseup', (e) => {
            if(highlight) {
                h_end = { x: e.clientX, y: e.clientY }
                end_highlighter()
            }
        })

        // end highlighter if the user clicks outside the window
        window.addEventListener('blur', (e) => {
            if(highlight) {
                end_highlighter()
            }
        })

        window.addEventListener('keyup', (e) => {
            if(e.key === 'Escape') {
                end_highlighter()
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
    
    testMenu.appendChild(moveAround)
    testMenu.appendChild(testInput)
    testMenu.appendChild(testButton)
    testMenu.appendChild(testHighlight)
    document.body.appendChild(testMenu)
    makeElementDraggable(testMenu, moveAround)

}
main()