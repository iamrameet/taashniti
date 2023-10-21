/// <reference path="./typings/express.d.ts"/>

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import express from "express";
import { WebSocketServer } from "ws";

import Logger from "./library/logger.js";
import Game from "./services/game.js";
import DataManager from "./services/data-manager.js";
import cookieParser from "./middlewares/cookie-parser.js";
// import authMiddleware from "./middlewares/user-auth.js";

globalThis.__dirname = path.dirname(fileURLToPath(import.meta.url));

Logger.logsDirectory = "logs";
Logger.testing = true;

const PORT = 80;
const WS_PORT = 800;

const expressServer = express();
const socketServer = new WebSocketServer({ port: WS_PORT }, function(){
  Logger.log("SOCKET_SERVER", `started  'ws://localhost:${WS_PORT}'`);
});

expressServer.use(express.json());
expressServer.use(express.urlencoded({ extended: false }));

expressServer.use(express.static(path.join(__dirname, "public")));

export class GameRoom {
  /** @type {Map<string, SessionUser>} */
  users = new Map;
  /** @type {Game | null} */
  game = null;
  /** @param {SessionUser} owner */
  constructor(id, owner){
    this.id = id;
    this.owner = owner;
  }
  /** @param {SessionUser} user */
  hasUser(user){
    return this.users.has(user);
  }
  /** @param {SessionUser} user */
  join(user){
    this.users.set(user.id, user);
    user.room = this;
    user.isReady = false;
    return true;
  }
  /** @param {SessionUser} user */
  leave(user){
    user.room = null;
    delete user.isReady;
    return this.users.delete(user.id, user);
  }
  /** @param {SessionUser} user */
  userReady(user, beReady = true){
    this.users[user.id].isReady = beReady;
    for(const [userId, user] of this.users){
      if(!user.isReady){
        return;
      }
    }
    this.game.begin();
  }
  async loadGame(id){
    try {
      const pathToFile = path.join(__dirname, "data/games", `${ id }.json`);
      const rawData = await readFile(pathToFile, { encoding: "utf-8" });
      const object = JSON.parse(rawData);
      this.game = Game.from(object);
      return true;
    } catch(ex) {
      console.log(ex);
      return false;
    }
  }
};

export class SessionUser {
  /** @type {GameRoom | null} */
  room = null;
  constructor(id, name){
    this.id = id;
    this.name = name;
  }
};


const users = new DataManager(SessionUser);
const rooms = new DataManager(GameRoom);

/** @type {express.RequestHandler} */
function authMiddleware(request, response, next){
  if(request.cookies && "sid" in request.cookies){
    if(!users.has(request.cookies.sid)){
      void response.clearCookie("sid", { httpOnly: true });
      return void response.status(401).json({ reason: "User not found" });
    }
    response.locals.user = users.get(request.cookies.sid);
    return void next();
  }
  response.status(401).json({ reason: "Authentication failed" });
}

expressServer.get("/user", cookieParser, authMiddleware, function(request, response){
  const { user } = response.locals;
  response.json(user);
});

expressServer.delete("/user", cookieParser, authMiddleware, function(request, response){
  response.clearCookie("sid", { httpOnly: true });
  response.json({ message: "user deleted" });
});

expressServer.post("/user", function(request, response){
  const id = Date.now().toString(36);
  const user = users.emplace(id, {}, id, request.body.displayName);
  response.cookie("sid", id, { httpOnly: true });
  response.json(user);
});

expressServer.post("/room/create", cookieParser, authMiddleware, function(request, response){
  const { user } = response.locals;
  const id = Date.now().toString(36);
  const room = rooms.emplace(id, {}, id, user);
  response.json(room);
});

/** @param {(user: SessionUser) => boolean} hasUserPredicate */
function roomCheck(request, response, next, hasUserPredicate){
  /** @type {express.Locals} */
  const { user } = response.local;
  if(user.room){
    if(!hasUserPredicate(user)){
      return void response.status(401).json({ reason: "Room permission denied" });
    }
    return void next();
  }
  response.status(404).json({ reason: "Room not found" });
}

function roomAdminAuth(request, response, next){
  roomCheck(request, response, next, user => user.room.owner === user);
}

function roomAuth(request, response, next){
  roomCheck(request, response, next, user => user.room.hasUser(user));
}

function roomValid(request, response, next){
  roomCheck(request, response, next, () => true);
}

expressServer.post("/room/:roomId/join", cookieParser, authMiddleware, roomValid, function(request, response){
  /** @type {express.Locals} */
  const { user } = response.locals;
  if(user.room.join(user)){
    return void response.json(user.room);
    // tell others too
  }
});

expressServer.put("/room/load/:gameId", cookieParser, authMiddleware, roomAdminAuth, async function(request, response){
  /** @type {express.Locals} */
  const { user } = response.locals;
  const isLoaded = await user.room.loadGame(request.params.gameId);
  if(isLoaded) {
    return void response.json(user.room.game);
    // tell others too
  }
  response.status(404).json({ reason: "Game not found" });
});

async function gameCheck(request, response, next){
  /** @type {express.Locals} */
  const { user } = response.locals;
  if(user.room.game !== null){
    return void next();
  }
  response.status(404).json({ reason: "Game not loaded" });
}

expressServer.put("/room/start", cookieParser, authMiddleware, roomAdminAuth, gameCheck, async function(request, response){
  /** @type {express.Locals} */
  const { user } = response.locals;
  user.room.game.begin();
  response.json({ message: "game started", timestamp: Date.now() });
  // tell others too
});

expressServer.put("/room/ready", cookieParser, authMiddleware, roomAuth, gameCheck, async function(request, response){
  /** @type {express.Locals} */
  const { user } = response.locals;
  user.room.userReady(user);
  response.json({ message: "user ready", user, timestamp: Date.now() });
  // tell others too
});

expressServer.put("/game/action", cookieParser, authMiddleware, roomAuth, gameCheck, async function(request, response){
  /** @type {express.Locals} */
  const { user } = response.locals;
  const { name, data } = request.body;
  try {
    const outcome = user.room.game.performAction(user.id, name, data);
    // send outcome to other users too
    response.json(outcome);
  } catch (reason) {
    response.status(500).json({ reason });
  }
});

expressServer.get("*", function(request, response){
  console.log("*");
  response.sendFile(path.join(globalThis.__dirname, "public", "index.html"));
});


socketServer.on("connection", function(socket){

  socket.on("message", function(buffer, isBinary){

    const data = JSON.stringify(buffer.toString());
    console.log(data);
    setTimeout(() => socket.send(data), 3000);
    socket.send(data, function(error){
      if(error){
        Logger.error("SOCKET_SERVER", "failed to respond to client", error);
      }
    });

  });

  socket.on("close", function(){
    Logger.log("SOCKET_SERVER", "client disconnected");
  })
});

expressServer.listen(PORT, function(){
  Logger.log("SERVER", `started on PORT '${PORT}'`);
});