"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewLobbyID = exports.lobbies = exports.clients = void 0;
const ws_1 = require("ws");
const Player_1 = __importDefault(require("./Player"));
const Network_1 = __importStar(require("./Network"));
const Net = __importStar(require("./Network"));
const Lobby_1 = __importDefault(require("./Lobby"));
const wss = new ws_1.WebSocketServer({
    port: 9000,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed if context takeover is disabled.
    }
});
exports.clients = new Map();
exports.lobbies = new Map();
wss.on("connection", (socket) => {
    socket.on("message", (data) => {
        let obj = JSON.parse(data.toString());
        let rawPacket = Network_1.default.from(obj);
        console.log(rawPacket);
        switch (rawPacket.type) {
            case Net.PacketType.C2SHello: {
                let packet = rawPacket;
                exports.clients.set(socket, new Player_1.default(socket, packet.steam));
                break;
            }
            case Net.PacketType.C2SGetLobbies: {
                let list = [];
                exports.lobbies.forEach((lobby) => {
                    list.push(lobby.data.lobby);
                });
                let lobbiesPacket = {
                    type: Net.PacketType.S2CLobbies,
                    lobbies: list
                };
                socket.send(JSON.stringify(lobbiesPacket));
                break;
            }
            case Net.PacketType.C2SPacket: {
                let packet = rawPacket;
                let player = exports.clients.get(socket);
                if (player != undefined && player.currentLobby != null) {
                    player.currentLobby.packetRecieve(packet, player);
                }
                break;
            }
            case Net.PacketType.C2SCreateLobby: {
                let packet = rawPacket;
                let player = exports.clients.get(socket);
                if (player != undefined) {
                    let lobby = new Lobby_1.default(player, packet.maxPlayers);
                    exports.lobbies.set(lobby.id, lobby);
                }
                else {
                    let joinLobbyPacket = {
                        type: Net.PacketType.S2CJoinLobby,
                        id: 100,
                        response: Net.StatusType.Error
                    };
                    socket.send(JSON.stringify(joinLobbyPacket));
                }
                break;
            }
            case Net.PacketType.C2SJoinLobby: {
                let packet = rawPacket;
                let lobby = exports.lobbies.get(packet.id);
                let player = exports.clients.get(socket);
                if (player == undefined) {
                    let joinLobbyPacket = {
                        type: Net.PacketType.S2CJoinLobby,
                        id: packet.id,
                        response: Network_1.StatusType.Error
                    };
                    socket.send(JSON.stringify(joinLobbyPacket));
                    break;
                }
                if (lobby != undefined) {
                    lobby.joinRequest(player);
                }
                else {
                    let joinLobbyPacket = {
                        type: Net.PacketType.S2CJoinLobby,
                        id: packet.id,
                        response: Network_1.StatusType.DoesntExist
                    };
                    socket.send(JSON.stringify(joinLobbyPacket));
                }
                break;
            }
            case Net.PacketType.C2SSetCode: {
                let codePacket = rawPacket;
                let player = exports.clients.get(socket);
                if (player != undefined && player.currentLobby != null) {
                    if (socket === player.currentLobby.host.socket) {
                        player.currentLobby.code = codePacket.code;
                        player.currentLobby.generateLobbyData();
                        //let currentLobbyPacket:Net.ClientboundCurrentLobbyPacket = {
                        //    type: Net.PacketType.S2CCurrentLobby,
                        //    lobby: lobbyData.lobby,
                        //    maxPlayers: lobbyData.maxPlayers
                        //}
                        //socket.send(JSON.stringify(currentLobbyPacket))
                    }
                }
                break;
            }
            case Net.PacketType.C2SLeaveLobby:
                let player = exports.clients.get(socket);
                if (player != undefined && player.currentLobby != null) {
                    player.currentLobby.playerLeave(player);
                }
                break;
            default:
                console.warn(`why tf is a server packet being sent??: ${data}`);
        }
    });
    socket.on("close", () => {
        let player = exports.clients.get(socket);
        if (player != undefined && player.currentLobby != null) {
            player.currentLobby.playerLeave(player);
        }
        exports.clients.delete(socket);
    });
});
function getNewLobbyID() {
    let newLobbyId = -1;
    let array = new Uint32Array(1);
    crypto.getRandomValues(array);
    newLobbyId = array[0];
    return newLobbyId;
}
exports.getNewLobbyID = getNewLobbyID;
setInterval(() => {
    console.log("Players Online: " + exports.clients.size + " | Lobbies active: " + exports.lobbies.size);
}, 5000);
