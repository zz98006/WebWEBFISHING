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
Object.defineProperty(exports, "__esModule", { value: true });
const Network_1 = require("./Network");
const WWF = __importStar(require("./WWF"));
class Lobby {
    constructor(host, maxPlayers) {
        this.players = [];
        this.maxPlayers = 12;
        this.id = WWF.getNewLobbyID();
        this.host = host;
        this.maxPlayers = maxPlayers;
        this.code = `TEMP-${this.id}`;
        this.joinRequest(host);
        this.data = this.generateLobbyData();
        let lobbyCreatePacket = {
            type: Network_1.PacketType.S2CCreateLobby,
            lobby: this.data.lobby,
            maxPlayers: maxPlayers,
        };
        this.host.socket.send(JSON.stringify(lobbyCreatePacket));
        this.generateLobbyData();
        host.setCurrentLobby(this);
    }
    getPlayerDataList() {
        const userdata = [];
        this.players.forEach((player) => {
            userdata.push(player.steam);
        });
        return userdata;
    }
    generateLobbyData() {
        this.data = {
            lobby: {
                id: this.id,
                name: this.host.steam.name + "'s Lobby",
                owner: this.host.steam.name,
                ownerId: this.host.steam.id,
                players: this.getPlayerDataList(),
                maxPlayers: this.maxPlayers
            },
            maxPlayers: this.maxPlayers
        };
        return this.data;
    }
    packetRecieve(packet, player) {
        this.players.forEach((user) => {
            if (user.socket !== player.socket) {
                let clientbound = { type: Network_1.PacketType.S2CPacket, member: packet.member, data: packet.data, channel: packet.channel };
                user.socket.send(JSON.stringify(clientbound));
            }
        });
    }
    joinRequest(player) {
        let packet = {
            type: Network_1.PacketType.S2CJoinLobby,
            id: this.id,
            response: Network_1.StatusType.Success
        };
        if (this.players.length >= this.maxPlayers) {
            packet.response = Network_1.StatusType.Full;
        }
        player.socket.send(JSON.stringify(packet));
        if (packet.response == Network_1.StatusType.Success) {
            player.setCurrentLobby(this);
            this.players.push(player);
            this.generateLobbyData();
            let playerJoinPacket = {
                type: Network_1.PacketType.S2CPlayerJoined,
                player: player.steam,
            };
            this.players.forEach((user) => {
                user.setCurrentLobby(this);
                user.socket.send(JSON.stringify(playerJoinPacket));
            });
        }
    }
    playerLeave(player) {
        player.currentLobby = null;
        this.players.splice(this.players.indexOf(player), 1);
        this.generateLobbyData();
        let playerLeftPacket = {
            type: Network_1.PacketType.S2CPlayerLeft,
            player: player.steam
        };
        this.players.forEach((user) => {
            user.setCurrentLobby(this);
            user.socket.send(JSON.stringify(playerLeftPacket));
        });
        if (player.socket === this.host.socket) {
            WWF.lobbies.delete(this.id);
        }
    }
}
exports.default = Lobby;
