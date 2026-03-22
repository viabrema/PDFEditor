export function setLastAction(state: any, message: string) {
  if (!state.ui) {
    state.ui = {};
  }
  state.ui.lastAction = message;
}
