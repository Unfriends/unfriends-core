export default ({ store }, inject) => {
  inject('emitToServer', (event, data) => {
    store.dispatch('$nuxtSocket/emit', {
      label: 'game',
      evt: event,
      msg: data,
    })
  })
  /* inject('onData', (event, data) => {
    store.dispatch('$nuxtSocket/emit', {
      label: 'game',
      evt: event,
      msg: data,
    })
  }) */
}
