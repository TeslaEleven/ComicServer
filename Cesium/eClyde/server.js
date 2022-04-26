const express = require('express');
const server = express();
server.get('/', (req, res)=>{
    res.sendFile('index.html', { root: __dirname })
})
server.get('/thanks', (req, res)=>{
    res.sendFile('thanks.html', { root: __dirname })
})

function keepAlive(){
    server.listen(3000)
}
module.exports = keepAlive;