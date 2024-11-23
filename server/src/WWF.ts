import WebSocket, { WebSocketServer } from 'ws';
import Player from './Player';
import Packets, { StatusType } from "./Network";
import Packet from "./Network";
import * as Net from "./Network";
import Lobby, { LobbyData, LobbyMetadata } from './Lobby';

const wss = new WebSocketServer({
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

export const clients: Map<WebSocket, Player> = new Map();
export const lobbies: Map<number, Lobby> = new Map();

wss.on("connection", (socket) => {
    socket.on("message", (data) => {
        let obj = JSON.parse(data.toString());
        let rawPacket: Packet = Packets.from(obj);
        console.log(rawPacket);
        switch (rawPacket.type) {
            case Net.PacketType.C2SHello: {
                let packet = rawPacket as Net.ServerboundHelloPacket;
                clients.set(socket, new Player(socket, packet.steam))
                break;
            }
            case Net.PacketType.C2SGetLobbies: {
                let list: LobbyMetadata[] = [];
                lobbies.forEach((lobby) => {
                    list.push(lobby.data.lobby);
                });

                let lobbiesPacket: Net.ClientboundLobbiesPacket = {
                    type: Net.PacketType.S2CLobbies,
                    lobbies: list
                }

                socket.send(JSON.stringify(lobbiesPacket));
                break;
            }
            case Net.PacketType.C2SPacket: {
                let packet = rawPacket as Net.ServerboundPacket;

                let player = clients.get(socket);
                if (player != undefined && player.currentLobby != null) {
                    player.currentLobby.packetRecieve(packet, player);
                }
                break;
            }
            case Net.PacketType.C2SCreateLobby: {
                let packet = rawPacket as Net.ServerboundCreateLobbyPacket;
                
                let player = clients.get(socket);
                if (player != undefined) {
                    let lobby = new Lobby(player, packet.maxPlayers);
                    lobbies.set(lobby.id, lobby);
                }
                else {
                    let joinLobbyPacket: Net.ClientboundJoinLobbyPacket = {
                        type: Net.PacketType.S2CJoinLobby,
                        id: 100,
                        response: Net.StatusType.Error
                    }
                    socket.send(JSON.stringify(joinLobbyPacket))
                }
                break;
            }
            case Net.PacketType.C2SJoinLobby: {
                let packet = rawPacket as Net.ServerboundJoinLobbyPacket;
                let lobby = lobbies.get(packet.id);
                let player = clients.get(socket);

                if (player == undefined) {
                    let joinLobbyPacket: Net.ClientboundJoinLobbyPacket = {
                        type: Net.PacketType.S2CJoinLobby,
                        id: packet.id,
                        response: StatusType.Error
                    }
                    socket.send(JSON.stringify(joinLobbyPacket))
                    break;
                }

                if (lobby != undefined) {
                    lobby.joinRequest(player);
                }
                else {
                    let joinLobbyPacket: Net.ClientboundJoinLobbyPacket = {
                        type: Net.PacketType.S2CJoinLobby,
                        id: packet.id,
                        response: StatusType.DoesntExist
                    }
                    socket.send(JSON.stringify(joinLobbyPacket))
                }
                break;
            }
            case Net.PacketType.C2SSetCode: {
                let codePacket = rawPacket as Net.ServerboundSetCodePacket;
                let player = clients.get(socket);
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
                let player = clients.get(socket);
                if (player != undefined && player.currentLobby != null) {
                    player.currentLobby.playerLeave(player);
                }
                break;
            default:
                console.warn(`why tf is a server packet being sent??: ${data}`)
        }
    });
    socket.on("close", () => {
        let player = clients.get(socket);
        if (player != undefined && player.currentLobby != null) {
            player.currentLobby.playerLeave(player);
        }
        clients.delete(socket);
    })
})

export function getNewLobbyID(): number {
    let newLobbyId = -1;
    let array = new Uint32Array(1);
    crypto.getRandomValues(array);
    newLobbyId = array[0];
    return newLobbyId;
}

setInterval(() => {
    console.log("Players Online: " + clients.size + " | Lobbies active: " + lobbies.size)
}, 5000)
