const { app, BrowserWindow } = require("electron");

function createWindow() {
	// Create a window
	const win = new BrowserWindow({
		width: 400,
		height: 300,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
	});

	// load electron project
	win.loadFile("./src/index.html");

	// prevent resizing of the window
	win.on("will-resize", e => e.preventDefault());
}

// when app is ready, create the window
app.on("ready", () => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
