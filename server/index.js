import { Server } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

const gameState = {
  players: [],
  bombHolder: null,
  gameActive: false,
  leader: null,
};

io.on("connection", (socket) => {
  
  io.emit("state", gameState);

  socket.on("joinGame", (playerName) => {
    const player = {id:socket.id, name:playerName}
    gameState.players.push(player);
    if (!gameState.bombHolder)
      {
        gameState.bombHolder = socket.id;
        gameState.leader = socket.id;
      }
    io.emit("state", gameState);
  })

  socket.on("startGame", () => {
      if(socket.id !== gameState.leader) return;
      if (gameState.gameActive) return;

      gameState.gameActive = true;
      gameState.remainingTime = Math.floor(Math.random()*30);
      gameState.loser = null;

      const timer = setInterval(() => {
        gameState.remainingTime -=1;
        io.emit("state", gameState);

        if(gameState.remainingTime <= 0){
          clearInterval(timer);
          gameState.remainingTime = 0;
          gameState.loser = gameState.bombHolder;

          io.emit("state", gameState);

          setTimeout(() => {
            gameState.gameActive = false;
            io.emit("state", gameState);
          }, 10000);
        }

      }, 1000);
  })


  socket.on("giveBomb", targetplayerID => {
    if(gameState.bombHolder !== socket.id) return;
    gameState.bombHolder = targetplayerID;
    io.emit("state", gameState);
  })

  socket.on("disconnect", () => {
    gameState.players = gameState.players.filter((p) => p.id !== socket.id);
    if (gameState.bombHolder === socket.id) {
      if (gameState.players.length > 0)
        gameState.bombHolder = gameState.players[
            Math.floor(Math.random() * gameState.players.length)
          ].id;
      else gameState.bombHolder = null;
    }
    if (gameState.leader === socket.id) {
      if (gameState.players.length > 0)
        gameState.leader = gameState.players[
            Math.floor(Math.random() * gameState.players.length)
          ].id;
      else gameState.leader = null;
    }

    if(gameState.players.length <= 0) gameState.gameActive = false;

    io.emit("state", gameState);
  });
});

server.listen(PORT, () => console.log("Server running on port " + PORT));
