fetch('http://localhost:3000/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        
    })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));