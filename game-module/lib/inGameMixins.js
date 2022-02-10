module.exports = {
  beforeCreate() {
    this.$parent.onEvent("game:stop", (data) => {
      this.onStop(data);
    });
  },
  methods: {
    onStop(data) {
      console.error("onStop methods is not overload", data);
      this.$parent.showLobby = true;
    },
  },
};
