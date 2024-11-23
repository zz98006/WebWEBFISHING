"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerSteamData = void 0;
const Network_1 = require("./Network");
class Player {
    constructor(socket, steam) {
        this.currentLobby = null;
        this.socket = socket;
        this.steam = steam;
    }
    setCurrentLobby(lobby) {
        lobby.generateLobbyData();
        this.currentLobby = lobby;
        const currentLobbyPacket = {
            type: Network_1.PacketType.S2CCurrentLobby,
            lobby: this.currentLobby.data.lobby,
            maxPlayers: this.currentLobby.data.maxPlayers
        };
        this.socket.send(JSON.stringify(currentLobbyPacket));
    }
}
exports.default = Player;
class PlayerSteamData {
    constructor() {
        this.name = "Player";
        this.id = -1;
    }
}
exports.PlayerSteamData = PlayerSteamData;
