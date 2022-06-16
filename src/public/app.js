const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");
const ul = room.querySelector("ul");
const nicknameBox = document.getElementById("nickname");
const nicknameForm = nicknameBox.querySelector("form");

room.hidden = true;

let roomName;

function addMessage(message) {
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handlelMessageSubmit(evnet) {
  evnet.preventDefault();
  const input = room.querySelector("#message input");
  const value = input.value;
  socket.emit("message", value, roomName, () => {
    addMessage(`You : ${value}`);
  });
  input.value = "";
}

function addNicknameTitle(name) {
  const nicknameTitle = nicknameBox.querySelector("h3");
  nicknameTitle.innerText = `Hello ${name}`;
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = nicknameForm.querySelector("input");
  const value = input.value;
  socket.emit("nickname", value, () => {
    addNicknameTitle(value);
  });
  input.value = "";
}

function leaveRoom() {
  welcome.hidden = false;
  room.hidden = true;
  ul.innerHTML = "";
}

function handleLeaveBtn() {
  socket.emit("leave", roomName, () => {
    leaveRoom();
  });
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${roomName}`;
  const msgForm = room.querySelector("#message");
  msgForm.addEventListener("submit", handlelMessageSubmit);
  const leaveBtn = document.getElementById("leave");
  leaveBtn.addEventListener("click", handleLeaveBtn);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
nicknameForm.addEventListener("submit", handleNicknameSubmit);

function roomTitle(count) {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${roomName} (${count})`;
}

socket.on("welcome", (user, newCount) => {
  addMessage(`${user} joined`);
  roomTitle(newCount);
});

socket.on("bye", (left, newCount) => {
  addMessage(`${left} left`);
  roomTitle(newCount);
});

socket.on("message", addMessage);

socket.on("room_change", (rooms) => {
  console.log(rooms);
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.appendChild(li);
  });
});
