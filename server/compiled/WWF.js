"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// There's 0 schema validation to this so it's possible to troll on the network
// I do not care, this game is already full of exploits
const types_1 = require("./types");
const ws_1 = require("ws");
const clients = new Map();
const lobbies = new Map();
function getFreeId(map) {
    let id = 100;
    while (map.has(id))
        id++;
    return id;
}
function send(client, message) {
    //console.log(`Sending to ${client.id}`, message);
    client.socket.send(JSON.stringify(message));
}
function getClient(steamId) {
    var _a;
    return (_a = [...clients.values()].find((c) => { var _a; return ((_a = c.steam) === null || _a === void 0 ? void 0 : _a.id) === steamId; })) !== null && _a !== void 0 ? _a : null;
}
function clientToNetwork(client) {
    var _a, _b, _c, _d;
    return {
        id: (_b = (_a = client.steam) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 0,
        name: (_d = (_c = client.steam) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : ""
    };
}
function lobbyToNetwork(lobby) {
    return {
        id: lobby.id,
        name: lobby.name,
        owner: lobby.owner,
        ownerId: lobby.ownerId,
        code: lobby.code,
        players: lobby.members
            .map((id) => {
            const member = getClient(id);
            if (member == null || member.steam == null)
                return null;
            return clientToNetwork(member);
        })
            .filter((x) => x != null),
        maxPlayers: lobby.maxPlayers
    };
}
function sendToLobby(lobby, message, filter) {
    for (const id of lobby.members) {
        const client = getClient(id);
        if (client != null && filter(client)) {
            send(client, message);
        }
    }
}
function updateLobbyForEveryone(lobby) {
    sendToLobby(lobby, {
        type: types_1.MessageType.S2CCurrentLobby,
        lobby: lobbyToNetwork(lobby)
    }, () => true);
}
function joinLobby(client, lobby) {
    lobby.members.push(client.steam.id);
    client.currentLobby = lobby.id;
    updateLobbyForEveryone(lobby);
}
function announceJoin(client, lobby) {
    sendToLobby(lobby, {
        type: types_1.MessageType.S2CPlayerJoined,
        player: clientToNetwork(client)
    }, (c) => c.id !== client.steam.id);
}
function leaveLobby(client, lobby, _isOwner = false) {
    sendToLobby(lobby, {
        type: types_1.MessageType.S2CPlayerLeft,
        player: clientToNetwork(client)
    }, (c) => c.id !== client.steam.id);
    lobby.members = lobby.members.filter((id) => { var _a; return id !== ((_a = client.steam) === null || _a === void 0 ? void 0 : _a.id); });
    updateLobbyForEveryone(lobby);
    if (lobby.members.length === 0) {
        lobbies.delete(lobby.id);
    }
}
function onMessage(client, message) {
    var _a, _b;
    switch (message.type) {
        case types_1.MessageType.C2SHello: {
            client.steam = message.steam;
            break;
        }
        case types_1.MessageType.C2SGetLobbies: {
            console.log(lobbies);
            send(client, {
                type: types_1.MessageType.S2CLobbies,
                lobbies: Array.from(lobbies.values()).map(lobbyToNetwork)
            });
            break;
        }
        case types_1.MessageType.C2SPacket: {
            if (client.currentLobby == null || client.steam == null)
                return;
            const lobby = lobbies.get(client.currentLobby);
            if (lobby == null)
                return;
            sendToLobby(lobby, {
                type: types_1.MessageType.S2CPacket,
                sender: client.steam.id,
                data: message.data,
                channel: message.channel
            }, (c) => { var _a; return ((_a = c.steam) === null || _a === void 0 ? void 0 : _a.id) === message.member; });
            break;
        }
        case types_1.MessageType.C2SCreateLobby: {
            if (client.currentLobby != null || client.steam == null)
                return;
            const lobby = {
                id: getFreeId(lobbies),
                name: `${client.steam.name}'s Lobby`,
                owner: client.steam.name,
                ownerId: client.steam.id,
                code: `TEMP-${client.id}`,
                maxPlayers: message.maxPlayers,
                members: []
            };
            lobbies.set(lobby.id, lobby);
            joinLobby(client, lobby);
            send(client, {
                type: types_1.MessageType.S2CCreateLobby,
                lobby: lobbyToNetwork(lobby)
            });
            send(client, {
                type: types_1.MessageType.S2CJoinLobby,
                id: lobby.id,
                response: types_1.ChatRoomEnterResponse.Success
            });
            announceJoin(client, lobby);
            break;
        }
        case types_1.MessageType.C2SJoinLobby: {
            if (client.currentLobby != null || client.steam == null) {
                send(client, {
                    type: types_1.MessageType.S2CJoinLobby,
                    id: message.id,
                    response: types_1.ChatRoomEnterResponse.Error
                });
                return;
            }
            const lobby = lobbies.get(message.id);
            if (lobby == null) {
                send(client, {
                    type: types_1.MessageType.S2CJoinLobby,
                    id: message.id,
                    response: types_1.ChatRoomEnterResponse.DoesntExist
                });
                return;
            }
            if (lobby.members.length >= lobby.maxPlayers) {
                send(client, {
                    type: types_1.MessageType.S2CJoinLobby,
                    id: message.id,
                    response: types_1.ChatRoomEnterResponse.Full
                });
                return;
            }
            joinLobby(client, lobby);
            announceJoin(client, lobby);
            send(client, {
                type: types_1.MessageType.S2CJoinLobby,
                id: lobby.id,
                response: types_1.ChatRoomEnterResponse.Success
            });
            break;
        }
        case types_1.MessageType.C2SSetCode: {
            if (client.currentLobby == null)
                return;
            const lobby = lobbies.get(client.currentLobby);
            if (lobby == null)
                return;
            if (lobby.ownerId !== ((_a = client.steam) === null || _a === void 0 ? void 0 : _a.id))
                return;
            lobby.code = message.code;
            break;
        }
        case types_1.MessageType.C2SLeaveLobby: {
            if (client.currentLobby == null)
                return;
            const lobby = lobbies.get(client.currentLobby);
            if (lobby == null)
                return;
            leaveLobby(client, lobby, ((_b = client.steam) === null || _b === void 0 ? void 0 : _b.id) === lobby.ownerId);
            break;
        }
    }
}
function onClose(client) {
    var _a;
    clients.delete(client.id);
    if (client.currentLobby != null) {
        const lobby = lobbies.get(client.currentLobby);
        if (lobby !== undefined) {
            leaveLobby(client, lobby, ((_a = client.steam) === null || _a === void 0 ? void 0 : _a.id) === lobby.ownerId);
        }
    }
}
const wss = new ws_1.WebSocketServer({
    port: 4158,
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
wss.on("connection", (socket) => {
    const id = getFreeId(clients);
    const client = {
        id,
        socket
    };
    clients.set(client.id, client);
    socket.on("open", () => {
        console.log(`Client ${id} connected`);
    });
    socket.on("message", (e) => {
        const message = JSON.parse(e.toString('utf8'));
        //console.log(`Client ${id} sent`, message);
        try {
            onMessage(client, message);
        }
        catch (e) {
            console.error("Error handling message", e);
        }
    });
    socket.on("close", () => {
        console.log(`Client ${id} disconnected`);
        try {
            onClose(client);
        }
        catch (e) {
            console.error("Error handling close", e);
        }
    });
    socket.on("error", (e) => {
        console.error(e);
    });
});
