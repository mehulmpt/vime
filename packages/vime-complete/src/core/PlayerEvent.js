// Treeshaking safe.
const PlayerEvent = function PlayerEvent() {};
PlayerEvent.MOUNT = 'mount';
PlayerEvent.DESTROY = 'destroy';
PlayerEvent.PLUGIN_MOUNT = 'pluginmount';
PlayerEvent.PLUGIN_DESTROY = 'plugindestroy';
PlayerEvent.GO_FULL_SCREEN = 'gofullscreen';
PlayerEvent.HIDE_FULL_SCREEN = 'hidefullscreen';
export default PlayerEvent;
