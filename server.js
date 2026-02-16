const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const gameLogic = require("./game");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// ─── Room Management ───
const rooms = {}; // roomCode -> { game, players: [{socketId, name, index}], config, started }

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function broadcastState(roomCode) {
  const room = rooms[roomCode];
  if (!room || !room.game) return;
  room.players.forEach(p => {
    if (p.socketId) {
      const view = gameLogic.getPlayerView(room.game, p.index);
      io.to(p.socketId).emit("game_state", { game: view, yourIndex: p.index });
    }
  });
}

function broadcastLobby(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const lobbyData = {
    roomCode,
    players: room.players.map(p => ({ name: p.name, index: p.index, connected: !!p.socketId })),
    maxPlayers: room.config.maxPlayers,
    hostIndex: 0,
    started: room.started,
  };
  room.players.forEach(p => {
    if (p.socketId) io.to(p.socketId).emit("lobby_update", lobbyData);
  });
}

io.on("connection", (socket) => {
  let currentRoom = null;
  let playerIndex = null;

  socket.on("create_room", ({ playerName, maxPlayers }, cb) => {
    const code = generateCode();
    rooms[code] = {
      game: null,
      players: [{ socketId: socket.id, name: playerName, index: 0 }],
      config: { maxPlayers: Math.min(6, Math.max(3, maxPlayers || 4)) },
      started: false,
    };
    currentRoom = code;
    playerIndex = 0;
    cb({ success: true, roomCode: code, yourIndex: 0 });
    broadcastLobby(code);
  });

  socket.on("join_room", ({ roomCode, playerName }, cb) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms[code];
    if (!room) return cb({ error: "Room not found" });
    if (room.started) {
      // Allow reconnection
      const existing = room.players.find(p => p.name === playerName);
      if (existing) {
        existing.socketId = socket.id;
        currentRoom = code;
        playerIndex = existing.index;
        cb({ success: true, roomCode: code, yourIndex: existing.index, reconnected: true });
        broadcastState(code);
        broadcastLobby(code);
        return;
      }
      return cb({ error: "Game already started" });
    }
    if (room.players.length >= room.config.maxPlayers) return cb({ error: "Room is full" });
    // Check for duplicate name
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return cb({ error: "Name already taken in this room" });
    }

    const idx = room.players.length;
    room.players.push({ socketId: socket.id, name: playerName, index: idx });
    currentRoom = code;
    playerIndex = idx;
    cb({ success: true, roomCode: code, yourIndex: idx });
    broadcastLobby(code);
  });

  socket.on("start_game", (_, cb) => {
    const room = rooms[currentRoom];
    if (!room) return cb({ error: "No room" });
    if (playerIndex !== 0) return cb({ error: "Only host can start" });
    if (room.players.length < 3) return cb({ error: "Need at least 3 players" });
    if (room.started) return cb({ error: "Already started" });

    const names = room.players.map(p => p.name);
    room.game = gameLogic.createGame(names);
    room.started = true;
    cb({ success: true });
    broadcastState(currentRoom);
    broadcastLobby(currentRoom);
  });

  // ─── Game Actions ───
  function handleAction(actionFn, ...args) {
    const room = rooms[currentRoom];
    if (!room || !room.game) return { error: "No game" };
    if (room.game.winner !== null) return { error: "Game is over" };
    // Most actions require it to be your turn
    if (room.game.currentPlayer !== playerIndex) return { error: "Not your turn" };
    const result = actionFn(room.game, ...args);
    if (result.success) broadcastState(currentRoom);
    return result;
  }

  socket.on("action_roll", ({ useTwoDice }, cb) => cb(handleAction(gameLogic.doRoll, useTwoDice)));
  socket.on("action_choose_die", ({ value }, cb) => cb(handleAction(gameLogic.doChooseDie, value)));
  socket.on("action_resolve", (_, cb) => cb(handleAction(gameLogic.doResolveProduction)));
  socket.on("action_convert", ({ cardId, doIt }, cb) => cb(handleAction(gameLogic.doConvert, cardId, doIt)));
  socket.on("action_sell", ({ cardId, doIt }, cb) => cb(handleAction(gameLogic.doSell, cardId, doIt)));
  socket.on("action_build", ({ tier, idx }, cb) => cb(handleAction(gameLogic.doBuild, tier, idx)));
  socket.on("action_trade_bank", ({ tokenType }, cb) => cb(handleAction(gameLogic.doTradeBank, tokenType)));
  socket.on("action_takeover", ({ targetPI, cardIdx }, cb) => cb(handleAction(gameLogic.doTakeover, targetPI, cardIdx)));
  socket.on("action_wipe", ({ tier }, cb) => cb(handleAction(gameLogic.doWipeMarket, tier)));
  socket.on("action_lobby_council", (_, cb) => cb(handleAction(gameLogic.doLobbyCouncil)));
  socket.on("action_pass", (_, cb) => cb(handleAction(gameLogic.doPass)));
  socket.on("action_play_card", ({ cardIdx }, cb) => cb(handleAction(gameLogic.doPlayActionCard, cardIdx)));
  socket.on("action_end_turn", (_, cb) => cb(handleAction(gameLogic.doEndTurn)));
  socket.on("action_discard", ({ type }, cb) => cb(handleAction(gameLogic.doDiscardToken, type)));

  socket.on("disconnect", () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) player.socketId = null;
      broadcastLobby(currentRoom);
      // Clean up empty rooms after 30 minutes
      setTimeout(() => {
        if (rooms[currentRoom] && room.players.every(p => !p.socketId)) {
          delete rooms[currentRoom];
        }
      }, 30 * 60 * 1000);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Bakerville server running on port ${PORT}`);
});
