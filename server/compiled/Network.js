"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusType = exports.PacketType = void 0;
class Packets {
    static from(packet) {
        switch (packet.type) {
            case PacketType.C2SHello:
                return packet;
            case PacketType.C2SGetLobbies:
                return packet;
            case PacketType.C2SPacket:
                return packet;
            case PacketType.C2SCreateLobby:
                return packet;
            case PacketType.C2SJoinLobby:
                return packet;
            case PacketType.C2SSetCode:
                return packet;
            case PacketType.C2SLeaveLobby:
                return packet;
        }
        return { type: PacketType.UNKNOWN };
    }
}
exports.default = Packets;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["C2SHello"] = 1] = "C2SHello";
    PacketType[PacketType["C2SGetLobbies"] = 2] = "C2SGetLobbies";
    PacketType[PacketType["S2CLobbies"] = 3] = "S2CLobbies";
    PacketType[PacketType["C2SPacket"] = 4] = "C2SPacket";
    PacketType[PacketType["S2CPacket"] = 5] = "S2CPacket";
    PacketType[PacketType["C2SCreateLobby"] = 6] = "C2SCreateLobby";
    PacketType[PacketType["S2CCreateLobby"] = 7] = "S2CCreateLobby";
    PacketType[PacketType["C2SJoinLobby"] = 8] = "C2SJoinLobby";
    PacketType[PacketType["S2CJoinLobby"] = 9] = "S2CJoinLobby";
    PacketType[PacketType["C2SSetCode"] = 10] = "C2SSetCode";
    PacketType[PacketType["C2SLeaveLobby"] = 11] = "C2SLeaveLobby";
    PacketType[PacketType["UNKNOWN"] = 12] = "UNKNOWN";
    PacketType[PacketType["S2CPlayerJoined"] = 13] = "S2CPlayerJoined";
    PacketType[PacketType["S2CPlayerLeft"] = 14] = "S2CPlayerLeft";
    PacketType[PacketType["S2CCurrentLobby"] = 15] = "S2CCurrentLobby";
})(PacketType || (exports.PacketType = PacketType = {}));
;
var StatusType;
(function (StatusType) {
    StatusType[StatusType["Success"] = 1] = "Success";
    StatusType[StatusType["DoesntExist"] = 2] = "DoesntExist";
    StatusType[StatusType["UNKNOWN"] = 3] = "UNKNOWN";
    StatusType[StatusType["Full"] = 4] = "Full";
    StatusType[StatusType["Error"] = 5] = "Error";
})(StatusType || (exports.StatusType = StatusType = {}));
;
