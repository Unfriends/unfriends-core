module.exports = {
  data() {
    return {
      isConnectedInRoom: false,
      showLobby: null,
      socket: null,
    };
  },
  mounted() {
    this.initSocket();
  },
  methods: {
    onHello(isGameStarted) {
      this.isConnectedInRoom = true;
      this.showLobby = !isGameStarted;
    },
    onNotification(notif) {
      console.log(
        "Received notif but method onNotification(notif) is not implemented",
        notif
      );
    },
    onSuccess(success) {
      console.log(
        "Received success but method onNotification(notif) is not implemented",
        success
      );
    },
    initSocket() {
      if (!process.client) {
        return;
      }
      this.socket = this.$nuxtSocket({
        channel: `/${this.$route.params.id}`,
        query: {
          token: this.$store.state.game.token,
        },
        persist: "game",
      });
      let connectTimeout = setTimeout(() => {
        location.replace(this.$config.matchmakerUrl);
      }, 10000);
      this.socket.once("hello", (isStarted) => {
        clearTimeout(connectTimeout);
        this.onHello(isStarted);
        this.askStates();
      });
      this.socket.on("lobby:state:update", (state) => {
        this.$store.commit("game/setLobbyState", state);
      });
      this.socket.on("game:state:update", (state) => {
        this.$store.commit("game/setGameState", state);
      });
      this.socket.on("game:config:update", (state) => {
        this.$store.commit("game/setGameConfig", state);
      });
      this.socket.on("game:private-infos:update", (state) => {
        this.$store.commit("game/setPrivateInfos", state);
      });
      this.socket.on("unfriend:notification", (notif) => {
        this.onNotification(notif);
      });
      this.socket.on("unfriend:success", async (key) => {
        let req = await this.$axios(
          `${this.$config.apiUrl}/api/success/${key}`
        );
        this.onSuccess(req.data);
      });
      this.socket.on("game:start", () => {
        this.showLobby = false;
        this.askStates();
      });
    },
    onEvent(event, cb) {
      this.socket.removeAllListeners(event);
      this.socket.on(event, (data) => {
        cb(data);
      });
    },
    askStates() {
      this.socket.emit("lobby:state", (state) => {
        this.$store.commit("game/setLobbyState", state);
      });
      this.socket.emit("game:state", (state) => {
        this.$store.commit("game/setGameState", state);
      });
      this.socket.emit("game:private-infos", (state) => {
        this.$store.commit("game/setPrivateInfos", state);
      });
      this.socket.emit("game:config", (state) => {
        this.$store.commit("game/setGameConfig", state);
      });
    },
  },
};
