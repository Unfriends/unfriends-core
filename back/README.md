# Game Socket Server - Unfriends Core

This package is used to help the creation of a game server on Unfriends.

More infos on [game-template](https://github.com/Unfriends/game-template) repository

### Namespace /matchmaker (Abstract)

On receive "getRooms"
Send "getRooms" to this client, with a list of room

On receive "createRoom"
Send "createRoom" to this client, a success message & room id

When a room is added
Send "addRoom" to clients, with room data

When a room is removed
Send "removeRoom" to clients, with room id

When a room is modified (user join, password set..)
Send "modifyRoom" to clients, with room data