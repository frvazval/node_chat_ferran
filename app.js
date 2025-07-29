import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { createClient } from '@libsql/client'
 
process.loadEnvFile();
const PORT = process.env.PORT;

const db = createClient({
    url : process.env.DB_URL,
    authToken : process.env.DB_TOKEN
})

await db.execute ( `
    CREATE TABLE IF NOT EXISTS messages (
    id_message INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    user TEXT default "anonimo",
    fecha TIMESTAMP default CURRENT_TIMESTAMP
    )
    `)

const app = express();
const server = createServer(app);

const io = new Server(server, {
    connectionStateRecovery: {}
})

io.on('connection', async (socket) => {
    console.log("Usuario conectado");

    // Evento de desconexión
    socket.on('disconnect', () => {
        console.log("Usuario desconectado");
    })

    socket.on('chat message', async( msg, username) => {
        let result

        try {
            result = await db.execute( {
                sql : `INSERT INTO messages (content, user) VALUES (:msg, :username)`,
                args : {msg, username }
            })

        } catch (err) {
            console.log(err);
            return
        }

        io.emit('chat message', msg, result.lastInsertRowid.toLocaleString(), username)
    })


    console.log(socket.handshake.auth);

    if(!socket.recovered) {
        try {
            const result = await db.execute({ 
                sql: "SELECT * FROM messages WHERE id_message > ?",
                args : [socket.handshake.auth.serverOffset ?? 0]
            })

            result.rows.forEach( row => {
                socket.emit('chat message', row.content, row.id_message.toLocaleString(), row.user, row.fecha)
            })

         } catch (err) {
            console.log(err);
            return
        }
    }

} )


app.use(logger('dev'));
app.use(express.static(process.cwd() + "/client"));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(PORT, () => {
    console.log(`Servidor abierto en http://localhost:${PORT}`);
});


