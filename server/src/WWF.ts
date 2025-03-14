// There's 0 schema validation to this so it's possible to troll on the network
// I do not care, this game is already full of exploits
import {
    ChatRoomEnterResponse,
    Message,
    MessageType,
    SteamData,
    NetworkPlayer,
    NetworkLobby
} from "./types";

import { WebSocketServer, WebSocket } from "ws";

type Client = {
    id: number;
    socket: WebSocket;
    steam?: SteamData;
    currentLobby?: number;
};

type Lobby = {
    id: number;
    name: string;
    owner: string;
    ownerId: number;
    code: string;
    maxPlayers: number;
    members: number[];
};

const clients = new Map<number, Client>();
const lobbies = new Map<number, Lobby>();

function getFreeId<T>(map: Map<number, T>): number {
    let id = 100;
    while (map.has(id)) id++;
    return id;
}

function send(client: Client, message: Message) {
    //console.log(`Sending to ${client.id}`, message);
    client.socket.send(JSON.stringify(message));
}

function getClient(steamId: number): Client | null {
    return [...clients.values()].find((c) => c.steam?.id === steamId) ?? null;
}

function clientToNetwork(client: Client): NetworkPlayer {
    return {
        id: client.steam?.id ?? 0,
        name: client.steam?.name ?? ""
    };
}

function lobbyToNetwork(lobby: Lobby): NetworkLobby {
    return {
        id: lobby.id,
        name: lobby.name,
        owner: lobby.owner,
        ownerId: lobby.ownerId,
        code: lobby.code,
        players: lobby.members
            .map((id) => {
                const member = getClient(id);
                if (member == null || member.steam == null) return null;
                return clientToNetwork(member);
            })
            .filter((x) => x != null),
        maxPlayers: lobby.maxPlayers
    };
}

function sendToLobby(
    lobby: Lobby,
    message: Message,
    filter: (client: Client) => boolean
) {
    for (const id of lobby.members) {
        const client = getClient(id);
        if (client != null && filter(client)) {
            send(client, message);
        }
    }
}

function updateLobbyForEveryone(lobby: Lobby) {
    sendToLobby(
        lobby,
        {
            type: MessageType.S2CCurrentLobby,
            lobby: lobbyToNetwork(lobby)
        },
        () => true
    );
}

function joinLobby(client: Client, lobby: Lobby) {
    lobby.members.push(client.steam!.id);
    client.currentLobby = lobby.id;
    updateLobbyForEveryone(lobby);
}

function announceJoin(client: Client, lobby: Lobby) {
    sendToLobby(
        lobby,
        {
            type: MessageType.S2CPlayerJoined,
            player: clientToNetwork(client)
        },
        (c) => c.id !== client.steam!.id
    );
}

function leaveLobby(client: Client, lobby: Lobby, _isOwner: boolean = false) {
    sendToLobby(
        lobby,
        {
            type: MessageType.S2CPlayerLeft,
            player: clientToNetwork(client)
        },
        (c) => c.id !== client.steam!.id
    );
    lobby.members = lobby.members.filter((id) => id !== client.steam?.id);
    updateLobbyForEveryone(lobby);
    if (lobby.members.length === 0) {
        lobbies.delete(lobby.id);
    }
}

function onMessage(client: Client, message: Message) {
    switch (message.type) {
        case MessageType.C2SHello: {
            client.steam = message.steam;
            break;
        }

        case MessageType.C2SGetLobbies: {
            console.log(lobbies);
            send(client, {
                type: MessageType.S2CLobbies,
                lobbies: Array.from(lobbies.values()).map(lobbyToNetwork)
            });
            break;
        }

        case MessageType.C2SPacket: {
            if (client.currentLobby == null || client.steam == null) return;
            const lobby = lobbies.get(client.currentLobby);
            if (lobby == null) return;
            sendToLobby(
                lobby,
                {
                    type: MessageType.S2CPacket,
                    sender: client.steam.id,
                    data: message.data,
                    channel: message.channel
                },
                (c) => c.steam?.id === message.member
            );
            break;
        }

        case MessageType.C2SCreateLobby: {
            if (client.currentLobby != null || client.steam == null) return;

            const lobby: Lobby = {
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
                type: MessageType.S2CCreateLobby,
                lobby: lobbyToNetwork(lobby)
            });
            send(client, {
                type: MessageType.S2CJoinLobby,
                id: lobby.id,
                response: ChatRoomEnterResponse.Success
            });
            announceJoin(client, lobby);

            break;
        }

        case MessageType.C2SJoinLobby: {
            if (client.currentLobby != null || client.steam == null) {
                send(client, {
                    type: MessageType.S2CJoinLobby,
                    id: message.id,
                    response: ChatRoomEnterResponse.Error
                });
                return;
            }

            const lobby = lobbies.get(message.id);
            if (lobby == null) {
                send(client, {
                    type: MessageType.S2CJoinLobby,
                    id: message.id,
                    response: ChatRoomEnterResponse.DoesntExist
                });
                return;
            }

            if (lobby.members.length >= lobby.maxPlayers) {
                send(client, {
                    type: MessageType.S2CJoinLobby,
                    id: message.id,
                    response: ChatRoomEnterResponse.Full
                });
                return;
            }

            joinLobby(client, lobby);
            announceJoin(client, lobby);
            send(client, {
                type: MessageType.S2CJoinLobby,
                id: lobby.id,
                response: ChatRoomEnterResponse.Success
            });

            break;
        }

        case MessageType.C2SSetCode: {
            if (client.currentLobby == null) return;

            const lobby = lobbies.get(client.currentLobby);
            if (lobby == null) return;
            if (lobby.ownerId !== client.steam?.id) return;
            lobby.code = message.code;

            break;
        }

        case MessageType.C2SLeaveLobby: {
            if (client.currentLobby == null) return;
            const lobby = lobbies.get(client.currentLobby);
            if (lobby == null) return;
            leaveLobby(client, lobby, client.steam?.id === lobby.ownerId);
            break;
        }
    }
}

function onClose(client: Client) {
    clients.delete(client.id);
    if (client.currentLobby != null) {
        const lobby = lobbies.get(client.currentLobby);
        if (lobby !== undefined) {
            leaveLobby(client, lobby, client.steam?.id === lobby.ownerId);
        }
    }
}
const wss = new WebSocketServer({
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

    const client: Client = {
        id,
        socket
    };
    clients.set(client.id, client);

    socket.on("open", () => {
        console.log(`Client ${id} connected`);
    });
    socket.on("message", (e) => {
        const message: Message = JSON.parse(e.toString('utf8'));
        //console.log(`Client ${id} sent`, message);
        try {
            onMessage(client, message);
        } catch (e) {
            console.error("Error handling message", e);
        }
    });
    socket.on("close", () => {
        console.log(`Client ${id} disconnected`);
        try {
            onClose(client);
        } catch (e) {
            console.error("Error handling close", e);
        }
    });
    socket.on("error", (e) => {
        console.error(e);
    });
});
