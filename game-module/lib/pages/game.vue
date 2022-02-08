<template>
  <div v-if="isConnectedInRoom && data">
    <LobbyComponent v-if="showLobby && config && lobby" />
    <GameComponent v-else-if="game && privateInfos && config" />
    <div v-else><Loading />wait for game infos</div>
  </div>
  <div v-else><Loading /></div>
</template>

<script>
import Vue from "vue";

export default Vue.extend({
  middleware: ["auth"],
  data() {
    return {
      socket: null,
      isConnectedInRoom: false,
      showLobby: true,
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
  mounted() {
    if (!process.client) {
      return;
    }
    console.log(this);
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
      this.isConnectedInRoom = true;
      this.showLobby = !isStarted;
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
    this.socket.on("game:start", () => {
      this.showLobby = false;
      this.askStates();
    });
    this.socket.on("game:stop", () => {
      this.showLobby = true;
      this.askStates();
    });
  },
  methods: {
    askStates() {
      if (this.showLobby == true) {
        this.socket.emit("lobby:state", (state) => {
          this.$store.commit("game/setLobbyState", state);
        });
      } else if (this.showLobby == false) {
        this.socket.emit("game:state", (state) => {
          this.$store.commit("game/setGameState", state);
        });
        this.socket.emit("game:private-infos", (state) => {
          this.$store.commit("game/setPrivateInfos", state);
        });
      }
      this.socket.emit("game:config", (state) => {
        this.$store.commit("game/setGameConfig", state);
      });
    },
  },
});
</script>
