const { resolve, join } = require("path");

export default function () {
  // store.registerModule('game', store);
  // this.nuxt.hook('build:before', () => {
  //   this.options.router.extendRoutes = (routes, resolve) => {
  //     routes.push({
  //       name: '_login',
  //       path: '/',
  //       component: resolve(__dirname, 'pages/login.vue'),
  //     })

  //     routes.push({
  //       name: '_game',
  //       path: '/game/:id',
  //       component: resolve(__dirname, 'pages/game.vue'),
  //     })
  //   }
  // })

  const pluginsToSync = ["middleware/auth.js", "socket.js", "mixin.js"];
  for (const pathString of pluginsToSync) {
    this.addPlugin({
      src: resolve(__dirname, pathString),
      fileName: join("game", pathString),
    });
  }
  // const foldersToSync = ["."];
  // for (const pathString of foldersToSync) {
  //   const path = resolve(__dirname, pathString);
  //   for (const file of readdirSync(path)) {
  //     this.addTemplate({
  //       src: resolve(path, file),
  //       fileName: join(namespace, pathString, file),
  //       options,
  //     });
  //   }
  // }
}
module.exports.meta = require("../package.json");
