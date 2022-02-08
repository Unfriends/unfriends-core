import Vue from "vue";

const devToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImlkLWRldiIsImlhdCI6MTY0NDMxMzY3NSwiZXhwIjoyNjQ0NjczNjc1fQ.0sd2srRyalGerWpFJvGW8zFOY6TlmtylKDTyt98VzFw";
const data = {
  id: "id-dev",
  creation: "2022-01-30T22:20:27.412Z",
  pseudo: "User",
  email: "",
  googleId: "",
  rank: "User",
  skin: '{"topType":"WinterHat1","facialHairColor":null,"mouthType":"Vomit","eyeType":"Squint","graphicType":"Bat","skinColor":"Pale","eyebrowType":"AngryNatural","clotheColor":"PastelBlue","clotheType":"Hoodie","hatColor":"PastelBlue"}',
};

Vue.mixin({
  data() {
    return {
      socket: null,
    };
  },
  computed: {
    lobby: function () {
      return this.$store.state.game.lobbyState;
    },
    config: function () {
      return this.$store.state.game.gameConfig;
    },
    game: function () {
      return this.$store.state.game.gameState;
    },
    privateInfos: function () {
      return this.$store.state.game.privateInfos;
    },
    data: function () {
      return this.$store.state.game.data;
    },
  },
  methods: {
    onHello(isGameStarted) {
      this.isConnectedInRoom = true;
      this.showLobby = !isGameStarted;
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
    },
    async setupAuth() {
      if (this.$config.dev === true) {
        this.$store.commit("game/setData", data);
        this.$store.commit("game/setToken", devToken);
        this.$router.push("/game/debug");
        return;
      }
      let token = this.getToken();
      if (!token) {
        this.sendToAuth();
      } else {
        this.$axios.setToken(token, "Bearer");
        try {
          let req = await this.$axios(`${this.$config.apiUrl}/api/user/me`);
          this.$store.commit("game/setData", req.data);
          this.authUserInApp(token);
        } catch (error) {
          console.log(error);
          this.sendToAuth();
        }
      }
    },
    sendToAuth() {
      location.replace(
        `${this.$config.authUrl}/?redirect_to=${this.$config.appName}&game=${this.$route.query.game}`
      );
    },
    getToken() {
      let token = this.$route.query.token;
      if (!token) {
        token = localStorage.getItem("jwt");
      }
      return token;
    },
    authUserInApp(token) {
      let gameId = this.$route.query.game;
      if (!gameId) {
        location.replace(this.$config.matchmakerUrl);
        return;
      }

      this.$store.commit("game/setToken", token);
      this.$router.push("/game/" + this.$route.query.game);
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
});
