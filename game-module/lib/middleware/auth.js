import Middleware from "../../middleware";

Middleware["auth"] = (context) => {
  const { route, store, redirect, $config } = context;
  let gameId = route.params.id;
  // console.log(context);
  // console.log($config);
  // If the user is not authenticated
  if (!store.state.game.token) {
    return redirect("/?game=" + gameId);
  }
};
