const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

async function getCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.id;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: false,
    video: { facingMode: "user" },
  };
  const cameraConstrains = {
    audio: false,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCamera();
    }
  } catch (error) {
    console.log(error);
  }
}

getMedia();

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enablef));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  } else {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  }
}

async function handleCameraChange() {
  await getMedia(cameraSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

/* const welcome = document.getElementById("welcome");
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
}); */
