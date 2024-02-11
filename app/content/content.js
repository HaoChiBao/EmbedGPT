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


const main = async () => {
    const port = await chrome.runtime.connect({ name: "content" });
    port.onMessage.addListener((msg) => {
        console.log(msg)
    });
    // return

    const moveAround = document.createElement('div')
    moveAround.className = 'move-around'
    
    const testMenu = document.createElement('div')
    testMenu.className = 'test-menu'
    
    const testButton = document.createElement('button')
    testButton.textContent = 'Test'
    testButton.onclick = async () => {
        
        // send message to background
        port.postMessage({ action: "test" });

        return
        await chrome.runtime.sendMessage({ action: "capture" }, (response) => {
            console.log(response)
        })
    }
    
    const testInput = document.createElement('input')
    testInput.type = 'text'
    testInput.placeholder = 'Test'
    
    testMenu.appendChild(moveAround)
    testMenu.appendChild(testInput)
    testMenu.appendChild(testButton)
    document.body.appendChild(testMenu)
    makeElementDraggable(testMenu, moveAround)

}
main()