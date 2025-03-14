export enum MessageType {
    C2SHello = 1,
    C2SGetLobbies = 2,
    S2CLobbies = 3,
    C2SPacket = 4,
    S2CPacket = 5,
    C2SCreateLobby = 6,
    S2CCreateLobby = 7,
    C2SJoinLobby = 8,
    S2CJoinLobby = 9,
    C2SSetCode = 10,
    C2SLeaveLobby = 11,
    S2CPlayerJoined = 13,
    S2CPlayerLeft = 14,
    S2CCurrentLobby = 15
}

export enum ChatRoomEnterResponse {
    Success = 1,
    DoesntExist = 2,
    Full = 4,
    Error = 5
}

export enum ChatState {
    Joined = 1,
    Left = 2
}

export type SteamData = {
    id: number;
    name: string;
};

export type NetworkPlayer = {
    id: number;
    name: string;
};

export type NetworkLobby = {
    id: number;
    name: string;
    owner: string;
    ownerId: number;
    code: string;
    players: NetworkPlayer[];
    maxPlayers: number;
};

export type C2SHelloMessage = {
    type: MessageType.C2SHello;
    steam: SteamData;
};

export type C2SGetLobbiesMessage = {
    type: MessageType.C2SGetLobbies;
};

export type S2CLobbiesMessage = {
    type: MessageType.S2CLobbies;
    lobbies: NetworkLobby[];
};

export type C2SPacketMessage = {
    type: MessageType.C2SPacket;
    member: number;
    channel: number;
    data: number[];
};

export type S2CPacketMessage = {
    type: MessageType.S2CPacket;
    sender: number;
    channel: number;
    data: number[];
};

export type C2SCreateLobbyMessage = {
    type: MessageType.C2SCreateLobby;
    maxPlayers: number;
};

export type S2CCreateLobbyMessage = {
    type: MessageType.S2CCreateLobby;
    lobby: NetworkLobby;
};

export type C2SJoinLobbyMessage = {
    type: MessageType.C2SJoinLobby;
    id: number;
};

export type S2CJoinLobbyMessage = {
    type: MessageType.S2CJoinLobby;
    id: number;
    response: ChatRoomEnterResponse;
};

export type C2SSetCodeMessage = {
    type: MessageType.C2SSetCode;
    code: string;
};

export type C2SLeaveLobbyMessage = {
    type: MessageType.C2SLeaveLobby;
};

export type S2CPlayerJoinedMessage = {
    type: MessageType.S2CPlayerJoined;
    player: NetworkPlayer;
};

export type S2CPlayerLeftMessage = {
    type: MessageType.S2CPlayerLeft;
    player: NetworkPlayer;
};

export type S2CCurrentLobbyMessage = {
    type: MessageType.S2CCurrentLobby;
    lobby: NetworkLobby;
};

export type Message =
    | C2SHelloMessage
    | C2SGetLobbiesMessage
    | S2CLobbiesMessage
    | C2SPacketMessage
    | S2CPacketMessage
    | C2SCreateLobbyMessage
    | S2CCreateLobbyMessage
    | C2SJoinLobbyMessage
    | S2CJoinLobbyMessage
    | C2SSetCodeMessage
    | C2SLeaveLobbyMessage
    | S2CPlayerJoinedMessage
    | S2CPlayerLeftMessage
    | S2CCurrentLobbyMessage;
