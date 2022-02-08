import Vue from "vue";

Vue.mixin({
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
});
