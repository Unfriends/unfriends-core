import Middleware from "../../middleware";

Middleware["auth"] = (context) => {
  const { route, store, redirect } = context;
  let gameId = route.params.id;
  // If the user is not authenticated
  if (!store.state.game.token) {
    return redirect("/?game=" + gameId);
  }
};
