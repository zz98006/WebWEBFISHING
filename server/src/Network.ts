import { PlayerSteamData } from "./Player";
import Lobby, {LobbyData, LobbyMetadata} from "./Lobby";

export default interface Packet {
    type: PacketType;
}

export default class Packets {
    static from(packet: Packet): Packet {
        switch (packet.type as PacketType) {
            case PacketType.C2SHello:
                return packet as ServerboundHelloPacket;
            case PacketType.C2SGetLobbies:
                return packet as ServerboundGetLobbiesPacket;
            case PacketType.C2SPacket:
                return packet as ServerboundPacket;
            case PacketType.C2SCreateLobby:
                return packet as ServerboundCreateLobbyPacket;
            case PacketType.C2SJoinLobby:
                return packet as ServerboundJoinLobbyPacket;
            case PacketType.C2SSetCode:
                return packet as ServerboundSetCodePacket;
            case PacketType.C2SLeaveLobby:
                return packet as ServerboundLeaveLobbyPacket;
        }
        return { type: PacketType.UNKNOWN } as Packet;
    }
}

export enum PacketType {
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
    UNKNOWN = 12,
    S2CPlayerJoined = 13,
    S2CPlayerLeft = 14,
    S2CCurrentLobby = 15
};

export enum StatusType {
    Success = 1,
    DoesntExist = 2,
    UNKNOWN = 3,
    Full = 4,
    Error = 5
};

export interface ServerboundHelloPacket extends Packet {
    steam: PlayerSteamData;
}

export interface ServerboundGetLobbiesPacket extends Packet { }

export interface ClientboundLobbiesPacket extends Packet {
    lobbies: LobbyMetadata[];
}

export interface ServerboundPacket extends Packet {
    member: number;
    channel: number;
    data: number[];
}

export interface ClientboundPacket extends Packet {
    member: number;
    channel: number;
    data: number[];
}


export interface ServerboundCreateLobbyPacket extends Packet {
    maxPlayers: number;
}


export interface ClientboundCreateLobbyPacket extends ClientboundCurrentLobbyPacket {
}

export interface ServerboundJoinLobbyPacket extends Packet {
    id:number;
}


export interface ClientboundJoinLobbyPacket extends Packet {
    id:number;
    response: StatusType;
}


export interface ServerboundSetCodePacket extends Packet {
    code: String;
}


export interface ServerboundLeaveLobbyPacket extends Packet { }

export interface ClientboundPlayerJoinedPacket extends Packet {
    player: PlayerSteamData;
}


export interface ClientboundPlayerLeftPacket extends Packet {
    player: PlayerSteamData;
}


export interface ClientboundCurrentLobbyPacket extends LobbyData, Packet {}