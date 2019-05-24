const { app, BrowserWindow } = require('electron')
const fs = require('fs-extra');
const path = require('path');

const h5pExtractor = require('h5p-extractor');
const h5p = require('h5p-nodejs-library');

const currentDir = path.resolve('');

const contentDir = `${currentDir}/h5p/content`;
const libraryDir = `${currentDir}/h5p/libraries`;
const contentId = 'fill-in-the-blanks-837';

let win;

async function removeWorkingDirs() {
  if (await fs.exists(contentDir)) {
    await fs.remove(contentDir);
  }
  if (await fs.exists(libraryDir)) {
    await fs.remove(libraryDir);
  }
}

async function createCleanWorkingDirs() {
  await removeWorkingDirs();
  await fs.mkdir(contentDir);
  await fs.mkdir(libraryDir);
}

async function createWindow() {
  win = new BrowserWindow({ width: 800, height: 600 })

  const h5p_route = `${currentDir}/h5p`;

  await createCleanWorkingDirs();
  const h5p_file = fs.createReadStream(`${currentDir}/test-files/${contentId}.h5p`);
  await h5pExtractor(h5p_file, libraryDir, contentDir);

  const h5p_json = await fs.readJSON(`${contentDir}/${contentId}/h5p.json`);
  const content_json = await fs.readJson(`${contentDir}/${contentId}/content/content.json`);
  const library_directory = libraryDir;
  const h5p_page = await h5p(
    contentId,
    h5p_json,
    content_json,
    library_directory,
    h5p_route,
    {
      integration: {
        url: `${currentDir}/h5p`
      }
    }
  );

  await fs.writeFile(`${currentDir}/temp.html`, h5p_page);
  win.loadFile(`${currentDir}/temp.html`);
  win.toggleDevTools();

  win.on('closed', () => {
    win = null;
  })
}

app.on('ready', async () => {
  await createWindow();
})

app.on('window-all-closed', async () => {
  await fs.unlink(`${currentDir}/temp.html`);
  await removeWorkingDirs();
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  if (win === null) {
    await createWindow()
  }
})
