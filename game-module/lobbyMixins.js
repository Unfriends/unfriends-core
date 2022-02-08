module.exports = {
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    isLeader: function () {
      return this.lobby.options.leaderId === this.data.id;
    },
  },
  methods: {
    leaveRoom() {
      this.loading = true;
      location.replace(this.$config.matchmakerUrl);
    },
    setRoomVisible() {
      this.$emitToServer("lobby:set-private", !this.lobby.options.private);
    },
    startGame() {
      this.$emitToServer("game:start");
    },
    kickPlayer(id) {
      this.$emitToServer("lobby:kick", id);
    },
    giveLeadership(id) {
      this.$emitToServer("lobby:give-lead", id);
    },
    sendMessageToLobby(message) {
      this.$emitToServer("lobby:send-message", message);
    },
  },
};
