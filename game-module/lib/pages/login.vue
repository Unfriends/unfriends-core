<template>
  <Loading />
</template>

<script>
export default {
  name: 'LoginPage',
  async mounted() {
    let token = this.getToken()
    if (!token) {
      this.sendToAuth()
    } else {
      this.$axios.setToken(token, 'Bearer')
      try {
        let req = await this.$axios('/api/user/me')
        this.$store.commit('game/setData', req.data)
        this.authUserInApp(token)
      } catch (error) {
        console.log(error)
        // this.sendToAuth()
      }
    }
  },
  methods: {
    sendToAuth() {
      location.replace(
        `${this.$config.authUrl}/?redirect_to=${this.$config.appName}&game=${this.$route.query.game}`
      )
    },
    getToken() {
      let token = this.$route.query.token || localStorage.getItem('jwt')
      return token
    },
    authUserInApp(token) {
      localStorage.setItem('jwt', token)
      this.$store.commit('game/setToken', token)
      this.$router.push('/game/' + this.$route.query.game)
    },
  },
}
</script>
