const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { Command, Option } = require('commander');

const program = new Command();

program
  .addOption(
    new Option(
      '-v, --view <view>',
      'The view type you wish to load (audio or video)',
    )
      .default('audio')
      .choices(['audio', 'video']),
  )
  .addOption(
    new Option(
      '--rt, --room-type <room-type>',
      'The key of the active room type you wish to load.'
    )
      .default('active')
  )
;

program.parse();

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

async function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// Somehow loadURL is a bit bugged, this seems to fix it on windows
// https://github.com/electron/electron/issues/28208#issuecomment-1129612599
async function attemptLoad(win, view) {
  let loaded = false;

  do {
    try {
      await win.loadURL(`http://127.0.0.1:9090/bundles/nodecg-vdoninja/graphics/${view}-view/main.html`);
      loaded = true;
    } catch (err) {
      await sleep(5);
    }
  } while (!loaded);
}

async function createWindow () {
  const { view, roomType } = program.opts();
  const titleInfo = [
    roomType || null
  ].filter(Boolean).join(',');

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: `VDO.Ninja Viewer - ${view === 'audio' ? 'Audio' : 'Video'} View ${titleInfo.length ? `(${titleInfo})` : ''}`,
    fullscreen: view === 'video',
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [
        `roomType:${roomType}`,
        'applyDelay:false', // TODO: implement when we need this
      ],
    },
  });

  // hack and a half
  // https://www.electronjs.org/docs/latest/api/browser-window#event-page-title-updated
  win.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  await attemptLoad(win, view);
  // Still nothing? Try again after 10 seconds
  await sleep(10);
  await attemptLoad(win, view);
}

app.whenReady().then(() => {
  createWindow().catch(console.log);

  // Specific macos stuff, doubt we ever need this.
  app.once('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch(console.log);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
