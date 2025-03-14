"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatState = exports.ChatRoomEnterResponse = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["C2SHello"] = 1] = "C2SHello";
    MessageType[MessageType["C2SGetLobbies"] = 2] = "C2SGetLobbies";
    MessageType[MessageType["S2CLobbies"] = 3] = "S2CLobbies";
    MessageType[MessageType["C2SPacket"] = 4] = "C2SPacket";
    MessageType[MessageType["S2CPacket"] = 5] = "S2CPacket";
    MessageType[MessageType["C2SCreateLobby"] = 6] = "C2SCreateLobby";
    MessageType[MessageType["S2CCreateLobby"] = 7] = "S2CCreateLobby";
    MessageType[MessageType["C2SJoinLobby"] = 8] = "C2SJoinLobby";
    MessageType[MessageType["S2CJoinLobby"] = 9] = "S2CJoinLobby";
    MessageType[MessageType["C2SSetCode"] = 10] = "C2SSetCode";
    MessageType[MessageType["C2SLeaveLobby"] = 11] = "C2SLeaveLobby";
    MessageType[MessageType["S2CPlayerJoined"] = 13] = "S2CPlayerJoined";
    MessageType[MessageType["S2CPlayerLeft"] = 14] = "S2CPlayerLeft";
    MessageType[MessageType["S2CCurrentLobby"] = 15] = "S2CCurrentLobby";
})(MessageType || (exports.MessageType = MessageType = {}));
var ChatRoomEnterResponse;
(function (ChatRoomEnterResponse) {
    ChatRoomEnterResponse[ChatRoomEnterResponse["Success"] = 1] = "Success";
    ChatRoomEnterResponse[ChatRoomEnterResponse["DoesntExist"] = 2] = "DoesntExist";
    ChatRoomEnterResponse[ChatRoomEnterResponse["Full"] = 4] = "Full";
    ChatRoomEnterResponse[ChatRoomEnterResponse["Error"] = 5] = "Error";
})(ChatRoomEnterResponse || (exports.ChatRoomEnterResponse = ChatRoomEnterResponse = {}));
var ChatState;
(function (ChatState) {
    ChatState[ChatState["Joined"] = 1] = "Joined";
    ChatState[ChatState["Left"] = 2] = "Left";
})(ChatState || (exports.ChatState = ChatState = {}));
