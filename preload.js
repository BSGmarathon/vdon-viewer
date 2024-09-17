const { contextBridge } = require('electron');

// The length of the args array is not guaranteed to be consistent across platforms,
// hence we need to search for our items instead of assuming their positions
function getArg(name) {
  const arg = process.argv.find(arg => arg.startsWith(`${name}:`));

  if (arg) {
    return arg.split(':')[1];
  }

  return '_';
}

contextBridge.exposeInMainWorld('electron', {
  roomType: getArg('roomType'),
  applyDelay: getArg('applyDelay') === 'true',
});