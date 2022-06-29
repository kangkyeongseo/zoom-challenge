const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;
let myNickName;

async function getCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
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
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// NickName Form

const nickNameBox = document.getElementById("nickName");
const nickNameForm = nickNameBox.querySelector("form");
const welcomeBox = document.getElementById("welcome");
const welcomeNickname = welcomeBox.querySelector("h3");
const changeBtn = document.getElementById("changeName");

welcomeBox.hidden = true;
changeBtn.hidden = true;

function startWelcome() {
  nickNameBox.hidden = true;
  welcomeBox.hidden = false;
  changeBtn.hidden = false;
  welcomeNickname.innerText = `Hello ${myNickName}`;
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = nickNameForm.querySelector("input");
  socket.emit("nickname", input.value, startWelcome);
  myNickName = input.value;
  input.value = "";
}

function handleChangeNickname() {
  nickNameBox.hidden = false;
  changeBtn.hidden = true;
}

nickNameForm.addEventListener("submit", handleNicknameSubmit);
changeBtn.addEventListener("click", handleChangeNickname);

// Welcome Form

const welcomeForm = welcomeBox.querySelector("form");
const roomList = welcomeBox.querySelector("#roomList");
const userList = welcomeBox.querySelector("#userList");
const callBox = document.getElementById("call");
const roomTitle = callBox.querySelector("h3");

callBox.hidden = true;

function addUserList(users) {
  userList.innerHTML = "";
  if (users.length === 0) {
    return;
  }
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user;
    userList.appendChild(li);
  });
}

function addRoomList(rooms) {
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.appendChild(li);
    li.addEventListener("click", handleEnterRoom);
  });
}

async function startCall() {
  welcomeBox.hidden = true;
  callBox.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await startCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  roomTitle.innerText = roomName;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Join Room

async function handleEnterRoom(event) {
  const enterRoomName = event.target.innerText;
  await startCall();
  socket.emit("join_room", enterRoomName);
  roomName = enterRoomName;
  roomTitle.innerText = enterRoomName;
}

// Chat Form
const chatBox = document.getElementById("chat");
const chatForm = chatBox.querySelector("form");
const chatList = chatBox.querySelector("ul");

function addMessage(msg) {
  const li = document.createElement("li");
  li.innerText = msg;
  chatList.append(li);
}

function handleChatForm(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  if (myDataChannel) {
    myDataChannel.send(input.value);
  }
  addMessage(`You : ${input.value}`);
  input.value = "";
}

chatForm.addEventListener("submit", handleChatForm);

// Leave Room

const leaveBtn = document.getElementById("leave");

function leaveRoom() {
  callBox.hidden = true;
  welcomeBox.hidden = false;
}

function handleLeaveBtn() {
  socket.emit("leave", roomName);
  leaveRoom();
}

leaveBtn.addEventListener("click", handleLeaveBtn);

// Socket code

socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (message) => {
    addMessage(`${myNickName} : ${message.data}`);
  });
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (message) => {
      addMessage(`${myNickName} : ${message.data}`);
    });
  });
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

socket.on("publicRoom", (rooms) => {
  addRoomList(rooms);
});

socket.on("userList", (users) => {
  addUserList(users);
});

const errorNotice = document.getElementById("errorMessage");

socket.on("error_message", (errorMessage) => {
  errorNotice.innerText = errorMessage;
});

// RTC code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServer: [
      {
        url: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peersFace = document.getElementById("peersFace");
  peersFace.srcObject = data.stream;
}
