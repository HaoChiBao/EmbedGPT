const test = document.getElementById('test');

const port = chrome.runtime.connect({ name: "content" });

port.onMessage.addListener((msg) => {
    console.log(msg)
})

test.addEventListener('click', () => {
    port.postMessage({ action: 'queryImage' });
})