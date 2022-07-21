const express = require('express')
const app = express()
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const formatMessage= require('./utils/messages')
const compression = require('compression')
// const createAdapter = require("@socket.io/redis-adapter").createAdapter;
// const redis = require("redis");
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')

//Creating a HTTP Server
const server = http.createServer(app)
const io = socketio(server)

app.use(compression())

//Set Static Folder
app.use(express.static(path.join(__dirname, 'public'))) //join the current directory with public folder

const botName = 'ChatCord Bot'

//Run when client connects
io.on('connection', socket => {     //I/O connection with socket as parameters
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room)    //Joining username and join

        socket.join(user.room)

        //Welcome current user
    socket.emit('message', formatMessage(botName,'Welcome to ChatCord'))   //Emits the message which is caught in main.js through socket.on

    //Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat!`)) //to broadcast those users who joined except the client
    
    //Send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    })
    })
    
    // io.emit()   //to broadcast everyone including client

    //Listen for chatMessage (to catch the emitted message)
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message', formatMessage(user.username, msg)) //emit to everyone
    })

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)   //check if which user left
        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!`))

    //Send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    })
        }
    })
})

const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))