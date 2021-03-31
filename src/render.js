// Inport from electron, node
const {
	desktopCapturer,
	Menu,
	dialog,
	globalShortcut,
} = require("electron").remote;
const { writeFile } = require("fs");

// elements from DOM
const errorMessage = document.getElementsByTagName("h3")[0];
const videoSourceBtn = document.querySelector("#source-btn");
const recordBtn = document.querySelector("#record-btn");

// Needed variables
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];
let recording = false;

const VIDEO_ENCODING = "video/webm; codecs=vp9";

// Register shortcut - Ctrl + Alt + I to start/stop recording
globalShortcut.register("Alt+CommandOrControl+I", () => {
	recordBtn.click();
});

// Handle record button click
recordBtn.addEventListener("click", () => {
	if (!mediaRecorder) return showMessage("Please select a source!");

	// If not recording, start recording, change buttons styles
	if (!recording) {
		mediaRecorder.start();
		recordBtn.textContent = "Stop";
		recordBtn.classList.add("stop");
		recordBtn.classList.remove("start");
		recording = true;
	} else {
		// stop recording, change button styles
		recording = false;
		mediaRecorder.stop();
		recordBtn.textContent = "Start";
		recordBtn.classList.add("start");
		recordBtn.classList.remove("stop");
	}
});

// show menu of all opened windows and screens so user can select source
videoSourceBtn.addEventListener("click", async () => {
	// Get all input sources
	const inputSources = await desktopCapturer.getSources({
		types: ["window", "screen"],
	});

	// create a menu using list of sources.
	const videoOptionsMenu = Menu.buildFromTemplate(
		inputSources.map(source => {
			return {
				label: source.name,
				click: () => selectSource(source),
			};
		})
	);

	// show menu poopup
	videoOptionsMenu.popup();
});

/**
 * handle select source
 *
 * @param {Object} source
 */
async function selectSource(source) {
	// change button text to selected source
	videoSourceBtn.textContent = source.name;

	// Create a Stream from media devices.
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: {
			mandatory: {
				chromeMediaSource: "desktop", // audio from desktop is mandatory
			},
		},
		video: {
			mandatory: {
				chromeMediaSource: "desktop",
				chromeMediaSourceId: source.id,
			},
		},
	});

	// Create the Media Recorder
	mediaRecorder = new MediaRecorder(stream, { mimeType: VIDEO_ENCODING });

	// when data is recorded, add them to the array
	mediaRecorder.ondataavailable = e => {
		recordedChunks.push(e.data);
	};

	// when screen is stopped recording
	mediaRecorder.onstop = async () => {
		// create BLOB from recorded chunks array
		const blob = new Blob(recordedChunks, {
			type: VIDEO_ENCODING,
		});

		// create buffer from BLOB
		const buffer = Buffer.from(await blob.arrayBuffer());

		// Show dialog box to save the video
		const { filePath } = await dialog.showSaveDialog({
			buttonLabel: "Save video",
			defaultPath: `vid-${Date.now()}.webm`,
		});

		// Write video to the box
		if (filePath) {
			writeFile(filePath, buffer, () => showMessage("Video saved!"));
		} else {
			showMessage("Video not saved!");
		}
		recordedChunks.length = 0; // reset recorded chunks
	};

	// Error message show
	mediaRecorder.onerror = () => {
		showMessage("Cant record. Make sure you have a source selected!");
	};
}

function showMessage(msg) {
	errorMessage.textContent = msg;
	errorMessage.style.padding = "0.3em";
	setTimeout(() => {
		errorMessage.textContent = "";
		errorMessage.style.padding = "";
	}, 2000);
}
