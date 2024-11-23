import Lobby from "./Lobby";
import WebSocket from 'ws';
import { ClientboundCurrentLobbyPacket, PacketType } from "./Network";
export default class Player {
    currentLobby: Lobby | null = null;
    socket: WebSocket;
    steam:PlayerSteamData;
    constructor(socket: WebSocket, steam:PlayerSteamData) {
        this.socket = socket;
        this.steam = steam;
    }

    setCurrentLobby(lobby:Lobby) {
        lobby.generateLobbyData();
        this.currentLobby = lobby;
        const currentLobbyPacket:ClientboundCurrentLobbyPacket = {
            type: PacketType.S2CCurrentLobby,
            lobby: this.currentLobby.data.lobby,
            maxPlayers: this.currentLobby.data.maxPlayers
        };
        this.socket.send(JSON.stringify(currentLobbyPacket))
    }
}


export class PlayerSteamData {
    name: string = "Player";
    id: number = -1;
}