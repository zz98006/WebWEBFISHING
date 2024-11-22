import {PacketType} from "./Main.js"
export default class Player {
    currentLobby = null;
    client = null;
    steam = {
        name: "Player",
        id: -1
    }

    setCurrentLobby(lobby){
        this.currentLobby = lobby;                
        this.client.send(JSON.stringify({
            type: PacketType.S2CCurrentLobby,
            lobby: this.currentLobby,
            maxPlayers: this.currentLobby.maxPlayers
        }))
    }
}