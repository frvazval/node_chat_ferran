import { io } from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js";

const formUserName = document.getElementById("formUserName");
const form = document.getElementById("form"); // formulario de los mensajes
const input = document.getElementById("message"); // input con elmensaje
const messages = document.getElementById("messages"); // lista con los mensajes

let userName = ""; // nombre del usuario actual
let socket;

let userColors = {}; // guardar los colores de cada usuario

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 85%)`;
}

formUserName.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputUserName = document.getElementById("userName");
  if (inputUserName.value) {
    userName = inputUserName.value;
    userColors[userName] = getRandomColor();
    // creamos el socket

    socket = io({
      auth: {
        serverOffset: 0,
        userName,
      },
    });

    socket.on("chat message", (msg, serverOffset, usuarioMensaje) => {
      if (!userColors[usuarioMensaje]) {
        userColors[usuarioMensaje] = getRandomColor();
      }

      const isOwn = usuarioMensaje === userName;
      const color = userColors[userName];

      let item = `<li class="message${
        isOwn ? " own" : " other"
      }" style="background:${color}">`;
      item += `${msg}<span>${usuarioMensaje}</span></li>`;
      messages.innerHTML += item;
      socket.auth.serverOffset = serverOffset;

      messages.scrollTop = messages.scrollHeight;
    });
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value && socket) {
    socket.emit("chat message", input.value, userName);
    input.value = "";
  }
});
