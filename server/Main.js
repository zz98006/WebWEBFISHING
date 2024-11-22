import WebSocket, { WebSocketServer } from 'ws';
import Player from './Player.js'
import Lobby from './Lobby.js'
export const PacketType = Object.freeze({
    C2SHello: 1,
    C2SGetLobbies: 2,
    S2CLobbies: 3,
    C2SPacket: 4,
    S2CPacket: 5,
    C2SCreateLobby: 6,
    S2CCreateLobby: 7,
    C2SJoinLobby: 8,
    S2CJoinLobby: 9,
    C2SSetCode: 10,
    C2SLeaveLobby: 11,
    S2CPlayerJoined: 13,
    S2CPlayerLeft: 14,
    S2CCurrentLobby: 15
});

export const StatusType = Object.freeze({
    Success: 1,
    DoesntExist: 2,
    Full: 4,
    Error: 5
});


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

let clients = new Map();
let lobbies = [];

wss.on('connection', function connection(client) {
    client.on('message', function message(data) {
        let packet = JSON.parse(data);
        switch (packet.type) {
            case PacketType.C2SHello: {
                let player = new Player();
                player.client = client;
                player.steam.id = packet.steam.id;
                player.steam.name = packet.steam.name;
                clients.set(client, player)
                break;
            }
            case PacketType.C2SGetLobbies: {
                let lobbydata = [];
                lobbies.forEach((lobby) => {
                    lobbydata.push(
                        {
                            id: lobby.id,
                            name: lobby.name,
                            owner: lobby.owner.name,
                            ownerId: lobby.owner.id,
                            players: lobby.players,
                            maxPlayers: lobby.maxPlayers
                        }
                    )
                })
                client.send(JSON.stringify({
                    "type": PacketType.S2CLobbies,
                    "lobbies": lobbydata
                }))
                break;
            }
            case PacketType.C2SSetCode: {
                let host = clients.get(client);
                host.currentLobby.code = packet.code;
                break;
            }
            case PacketType.C2SCreateLobby: {
                let host = clients.get(client);
                let lobby = new Lobby(host.steam, packet);
                lobby.code = lobbies.length + 100;
                lobbies.push(lobby);
                host.setCurrentLobby(lobby);
                client.send(JSON.stringify({
                    type: PacketType.S2CCreateLobby,
                    lobby: lobby,
                    maxPlayers: lobby.maxPlayers
                }))
                client.send(JSON.stringify({
                    type: PacketType.S2CJoinLobby,
                    id: lobby.id,
                    response: StatusType.Success
                }))
                client.send(JSON.stringify({
                    type: PacketType.S2CPlayerJoined,
                    player: host
                }))
                break;
            }
            case PacketType.C2SJoinLobby: {
                clients.get(client).setCurrentLobby(lobbies[packet.id - 100]);
                break;
            }
            case PacketType.C2SPacket: {
                clients.get(client).currentLobby.owner.client.send(JSON.stringify(
                    {
                        type: PacketType.S2CPacket,
                        member: packet.member,
                        channel: packet.channel,
                        data: packet.data
                    }
                ))
                break;
            }
        }
        console.log(packet);
    });
})