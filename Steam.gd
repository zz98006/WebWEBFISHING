extends Node

signal lobby_created
signal lobby_joined
signal join_requested
signal p2p_session_request
signal persona_state_change
signal lobby_chat_update
signal lobby_match_list

const LOBBY_TYPE_PRIVATE = 0
const LOBBY_TYPE_FRIENDS_ONLY = 1
const LOBBY_TYPE_PUBLIC = 2
const LOBBY_TYPE_INVISIBLE = 3

func req(data):
	JavaScript.eval("window.saving_in_progress = " + str(UserSave.saving_in_progress).to_lower() + ";", true)

	var msg = JSON.print(data)
	var json = JavaScript.eval("window.bridge.process('" + msg + "');", true)
	var result = JSON.parse(json).result
	return result

func run_callbacks():
	var arr = req({
		"type": "poll"
	})
	for i in arr:
		match i["type"]:
			"lobby_created":
				emit_signal("lobby_created", 1, int(i["id"]))
			"lobby_joined":
				emit_signal("lobby_joined", int(i["id"]), 0, 0, int(i["response"]))
			"p2p_session_request":
				emit_signal("p2p_session_request", int(i["id"]))
			"lobby_chat_update":
				emit_signal("lobby_chat_update", int(i["id"]), 0, i["player"], i["state"])
			"lobby_match_list":
				emit_signal("lobby_match_list", i["data"])


func steamInit():
	return {
		"status": 1
	}

func isSubscribed():
	return true

func loggedOn():
	return true

func getSteamID():
	return int(req({
		"type": "getSteamID"
	}))

func getPersonaName():
	return req({
		"type": "getPersonaName"
	})


func activateGameOverlayToUser(type, id):
	pass

func setRichPresence(key, value):
	pass


func addRequestLobbyListDistanceFilter(filter):
	pass

func addRequestLobbyListStringFilter(key, value, comparison):
	pass

func addRequestLobbyListFilterSlotsAvailable(slots):
	pass

func setLobbyJoinable(id, joinable):
	pass

func allowP2PPacketRelay(allow):
	pass

func acceptP2PSessionWithUser(id):
	pass

func closeP2PSessionWithUser(id):
	pass


func getAchievement(id):
	return {
		"ret": true, 
		"achieved": true
	}

func setStatInt(id, value):
	pass

func setAchievement(id):
	pass

func storeStats():
	pass


func requestLobbyList():
	req({
		"type": "requestLobbyList"
	})

func getNumLobbyMembers(lobby):
	return int(req({
		"type": "getNumLobbyMembers", 
		"lobby": lobby
	}))

func getLobbyMemberByIndex(lobby, index):
	return int(req({
		"type": "getLobbyMemberByIndex", 
		"lobby": lobby, 
		"index": index
	})["id"])

func getLobbyData(id, key):
	var data = req({
		"type": "getLobbyData", 
		"id": id
	})
	match key:
		"name":
			return data["owner"]
		"lobby_name":
			return data["name"]
		"age_limit":
			return "false"
		"cap":
			return int(data["maxPlayers"])
		"version":
			return 1.1
		"type":
			return "public"
		"banned_players":
			return ""
		"code":
			return data["code"]
		"server_browser_value":
			return "0"

func createLobby(type, limit):
	return req({
		"type": "createLobby", 
		"maxPlayers": limit
	})

func joinLobby(id):
	return req({
		"type": "joinLobby", 
		"id": id
	})

func leaveLobby(id):
	return req({
		"type": "leaveLobby"
	})

func setLobbyData(id, key, value):
	if key == "code":
		req({
			"type": "setCode", 
			"code": value
		})

func getAvailableP2PPacketSize(channel):
	return int(req({
		"type": "getAvailableP2PPacketSize", 
		"channel": channel
	}))

func readP2PPacket(packet, channel):
	var data = req({
		"type": "readP2PPacket", 
		"channel": channel
	})
	return {
		"steam_id_remote": int(data["sender"]), 
		"data": PoolByteArray(data["data"])
	}

func sendP2PPacket(member, data, _type, channel):
	req({
		"type": "sendP2PPacket", 
		"member": member, 
		"data": Array(data), 
		"channel": channel
	})

func getFriendPersonaName(id):
	return req({
		"type": "getFriendPersonaName", 
		"id": id
	})

func getP2PSessionState(remote ):
	return {
		"connection_active": true
	}

func getLobbyOwner(id):
	return int(req({
		"type": "getLobbyOwner", 
		"id": id
	}))
