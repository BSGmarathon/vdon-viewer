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
      '-rt, --room-type <room-type>',
      'The key of the active room type you wish to load.'
    )
      .default('active')
  )
;

program.parse();

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow () {
  const { view, roomType } = program.opts();
  const titleExtraOpts = [
    roomType || null
  ].filter(Boolean).join(',');

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    // Vue is overwriting the title, this is just wasting cpu cycles.
    // But then again, we're using electron so who fucking cares lmao
    title: `VDO.Ninja Viewer - ${view === 'audio' ? 'Audio' : 'Video'} View ${titleExtraOpts.length ? `(${titleExtraOpts})` : ''}`,
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

  win.loadURL(`http://localhost:9090/bundles/nodecg-vdoninja/graphics/${view}-view/main.html`).catch(console.error);
}

app.whenReady().then(() => {
  createWindow();

  // Specific macos stuff, doubt we ever need this.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
