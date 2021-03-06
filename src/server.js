import http from "http";
import SocketIO from "socket.io";
import express from "express";
import { getuid } from "process";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {
  const {
    sockets: {
      adapter: { rooms, sids },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((value, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function userList() {
  const {
    sockets: { sockets },
  } = wsServer;
  const usersNickname = [];
  sockets.forEach((value, key) => usersNickname.push(value.nickname));
  return usersNickname;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.emit("userList", userList());
  socket.emit("publicRoom", publicRooms());
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
    wsServer.sockets.emit("publicRoom", publicRooms());
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
  socket.on("nickname", (name, done) => {
    if (userList().includes(name)) {
      socket.emit("error_message", "This Nickname is already in use");
    } else {
      socket["nickname"] = name;
      wsServer.sockets.emit("userList", userList());
      done();
    }
  });
  socket.on("leave", (roomName) => {
    socket.leave(roomName);
    wsServer.sockets.emit("publicRoom", publicRooms());
  });
});

httpServer.listen(3000, () =>
  console.log("Listening on http://localhost:3000")
);
