import Player from "./Player.js";

export default class Lobby {
    id = -1;
    name = "lobby";
    owner = new Player();
    code = "TEMP";
    players = [];
    maxPlayers = 12;
    constructor(player, packet) {
        this.id = 100;
        this.owner = player;
        this.code = "TEMP-100";
        this.players.push(this.owner);
        this.maxPlayers = packet.maxPlayers;
    }
}