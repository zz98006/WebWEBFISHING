import { join } from "path";
import { ClientboundCreateLobbyPacket, ClientboundJoinLobbyPacket, ClientboundPacket, ClientboundPlayerJoinedPacket, ClientboundPlayerLeftPacket, PacketType, ServerboundPacket, StatusType } from "./Network";
import Player, { PlayerSteamData } from "./Player";
import * as WWF from "./WWF";
export default class Lobby {
    id: number;
    data: LobbyData;
    host: Player;
    players: Array<Player> = [];
    code: String;
    maxPlayers: number = 12;
    constructor(host: Player, maxPlayers: number) {
        this.id = WWF.getNewLobbyID();
        this.host = host;
        this.maxPlayers = maxPlayers;
        this.code = `TEMP-${this.id}`;
        this.joinRequest(host)
        this.data = this.generateLobbyData();
        let lobbyCreatePacket: ClientboundCreateLobbyPacket = {
            type: PacketType.S2CCreateLobby,
            lobby: this.data.lobby,
            maxPlayers: maxPlayers,
        }
        this.host.socket.send(JSON.stringify(lobbyCreatePacket))
        this.generateLobbyData()
        host.setCurrentLobby(this);
    }
    getPlayerDataList(): Array<PlayerSteamData> {
        const userdata: Array<PlayerSteamData> = [];
        this.players.forEach((player) => {
            userdata.push(player.steam);
        })
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
        }
        return this.data;
    }

    packetRecieve(packet: ServerboundPacket, player: Player) {
        this.players.forEach((user) => {
            if (user.socket !== player.socket) {
                let clientbound: ClientboundPacket = { type: PacketType.S2CPacket, member: packet.member, data: packet.data, channel: packet.channel };
                user.socket.send(JSON.stringify(clientbound));
            }
        })
    }

    joinRequest(player: Player) {
        let packet: ClientboundJoinLobbyPacket = {
            type: PacketType.S2CJoinLobby,
            id: this.id,
            response: StatusType.Success
        }

        if (this.players.length >= this.maxPlayers) {
            packet.response = StatusType.Full;
        }
        player.socket.send(JSON.stringify(packet))

        if (packet.response == StatusType.Success) {
            player.setCurrentLobby(this);
            this.players.push(player);
            this.generateLobbyData();
            let playerJoinPacket: ClientboundPlayerJoinedPacket = {
                type: PacketType.S2CPlayerJoined,
                player: player.steam,
            }
            this.players.forEach((user) => {
                user.setCurrentLobby(this);
                user.socket.send(JSON.stringify(playerJoinPacket));
            })
        }
    }

    playerLeave(player: Player) {
        player.currentLobby = null;
        this.players.splice(this.players.indexOf(player), 1);
        this.generateLobbyData();
        let playerLeftPacket: ClientboundPlayerLeftPacket = {
            type: PacketType.S2CPlayerLeft,
            player: player.steam
        }
        this.players.forEach((user) => {
            user.setCurrentLobby(this);
            user.socket.send(JSON.stringify(playerLeftPacket));
        })
        if (player.socket === this.host.socket) {
            WWF.lobbies.delete(this.id);
        }
    }

}

export interface LobbyData {
    lobby: LobbyMetadata;
    maxPlayers: number; // i hate this with a passion
}

export interface LobbyMetadata {
    id: number,
    name: String,
    owner: String,
    ownerId: number,
    players: Array<PlayerSteamData>,
    maxPlayers: number
}

