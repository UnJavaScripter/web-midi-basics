"use strict";
// uiStuff is a custom class I created to handle UI Stuff, it has NOTHING to do with the Web MIDI API. I just wanted to keep things separate
let uiStuff;
class WebMidiDemo {
    constructor() {
        this.init();
    }
    async init() {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            this.onMIDISuccess(midiAccess);
        }
        catch (err) {
            this.onMIDIFailure(err);
        }
    }
    onMIDISuccess(midiAccess) {
        this.inputDevicesList = midiAccess.inputs;
        this.outputDevicesList = midiAccess.outputs;
        // One more, time uiStuff is a custom class I created to handle UI Stuff, it has NOTHING to do with the Web MIDI API. I just wanted to keep things separate
        uiStuff.createSelect(midiAccess.inputs.values(), this.onMidiInputPortSelected.bind(this), '<Select an Input device>'); // here this.onMidiInputPortSelected is the select's `onchange` event callback function
        // Again, uiStuff is a custom class I created to handle UI Stuff, it has NOTHING to do with the Web MIDI API. I just wanted to keep things separate
        uiStuff.createSelect(midiAccess.outputs.values(), this.onMidiOutputPortSelected.bind(this), '<Select an Output device>'); // here this.onMidiOutputPortSelected is the select's `onchange` event callback function
    }
    onMIDIFailure(err) {
        console.log(`Failed to get MIDI access - ${err}`);
    }
    onMidiInputPortSelected(selection) {
        if (this.selectedInputDevice) {
            this.selectedInputDevice.close();
        }
        const selectedInputDeviceId = selection.target.value;
        console.log('Input port', selectedInputDeviceId);
        this.selectedInputDevice = this.inputDevicesList.get(selectedInputDeviceId);
        this.selectedInputDevice.onmidimessage = this.handleMIDIMessage.bind(this);
    }
    onMidiOutputPortSelected(selection) {
        if (this.selectedOutputDevice) {
            this.selectedOutputDevice.close();
        }
        const selectedOutputDeviceId = selection.target.value;
        console.log('Output port', selectedOutputDeviceId);
        this.selectedOutputDevice = this.outputDevicesList.get(selectedOutputDeviceId);
    }
    handleMIDIMessage(event) {
        const [action, keyId, velocity] = event.data;
        console.log([action, keyId, velocity]);
        if (action === 144) {
            // a method to change the body's background color on each key press, not related to Web MIDI
            uiStuff.changeBackgroundColor(keyId);
            if (this.selectedOutputDevice) {
                this.selectedOutputDevice.send([action, keyId, 10]);
            }
        }
    }
}
/*
* Unrelated UI stuff, don't mind me!
*/
class UIStuff {
    constructor() {
        this.color = 0;
    }
    createSelect(options, cangeCallback, defaultOptionLabel) {
        const addOption = (value, text) => {
            const optionElem = document.createElement('option');
            optionElem.value = value;
            optionElem.text = text;
            selectElem.add(optionElem);
        };
        const selectElem = document.createElement('select');
        addOption('', defaultOptionLabel || 'Select an option');
        for (let option of options) {
            addOption(option.id, option.name);
        }
        selectElem.onchange = cangeCallback;
        this.render(selectElem);
    }
    render(elem) {
        document.body.appendChild(elem);
    }
    changeBackgroundColor(val) {
        console.log(document.body.style.backgroundColor);
        this.color += val;
        console.log(this.color);
        document.body.style.backgroundColor = `#${Number(this.color).toString(16)}`;
        console.log(document.body.style.backgroundColor);
    }
}
uiStuff = new UIStuff();
new WebMidiDemo();
