# Web MIDI

MIDI is a protocol that electronic musical instruments, controllers and computers (and now browsers) use to communicate with each other.

Web MIDI API supports the MIDI protocol and has been available since Chrome 43. It should be made clear that this API is not related with the playback of the MIDI/SMF files. It allows us instead to handle MIDI devices's input and output interfaces to send and receive messages through our web applications.

## The messages
A MIDI message typically comprises a **command** or action that specifies what the interaction represents: pressing or releasing a key. Then we have the value of the **note**, and finally we have the **velocity** which represents how hard did you press a key, this can be interpreted as a higher volume the harder the key is pressed.

These three values are received by the browser as an array:

```js
  // command, note, velocity
  [144, 119, 127]
```

- `144` is the command, this one specifically means "note on". After you release the key, a new message will be fired with a command value of `128`, this is the "note off" command.
- `119` is the note number
- `127` is the speed, it ranges from 0 to 127

## The post

This was also published [as an article here](https://dev.to/unjavascripter/connecting-the-musical-world-to-the-web-using-the-web-midi-api-572p), just FYI.

## Web MIDI API

![m2m](https://user-images.githubusercontent.com/7959823/78785372-58879000-79a7-11ea-80c5-175ef62f9566.gif)

I'll be creating an app that can make two different MIDI devices interact with each other and the browser.

### Getting MIDI access

Here I'm creating a class that will call an `async` init function that will first check if `navigator.requestMIDIAccess()` can be executed, if not, will call it a day by invoking `onMIDIFailure` to log a message to the user to let them know their browser can't handle Web MIDI. If it is however supported, a [`MIDIAccess` object](https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess) will be passed to the `onMIDISuccess` success callback.

```js
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
  // ...
  onMIDIFailure(err) {
    console.log(`Failed to get MIDI access - ${err}`);
  }
  // ...
```

### Listing MIDI devices

The first thing I'm doing in this specific example is storing the detected MIDI input and output devices list for later use.

After that I'm using a separate class I created to handle the creation of a couple of `<select>` elements so the user can pick the devices. I'm passing a callback function, `onMidiInputPortSelected` and `onMidiOutputPortSelected` for each to handle the `onchange` event of the `<select>`. If you're curious about `.bind(this)`, take a look at [this article](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind).

```js
onMIDISuccess(midiAccess) {
  this.inputDevicesList = midiAccess.inputs;
  this.outputDevicesList = midiAccess.outputs;
  
  // uiStuff is a custom class I created to handle UI Stuff, it has NOTHING to do with the Web MIDI API. I just wanted to keep things separate
  uiStuff.createSelect(midiAccess.inputs.values(), this.onMidiInputPortSelected.bind(this), '<Select an Input device>');
  uiStuff.createSelect(midiAccess.outputs.values(), this.onMidiOutputPortSelected.bind(this), '<Select an Output device>');
}
```


### Attaching callbacks

Notice how I close any previous selected device port, however it's possible to skip this step and have multiple ports open at the same time.

Now it's time to use the previously stored _devicesList_. Since it is _Map_ like, I can use Map's `get` method to query it and bring the MIDI device with the ID that matches the selection.

After creating a reference for both the selected input and output device, I can attach a callback to the `onmidimessage`, which we will cover next.

```js
onMidiInputPortSelected(selection) {
  if (this.selectedInputDevice) {
    this.selectedInputDevice.close();
  }

  const selectedInputDeviceId = selection.target.value;

  this.selectedInputDevice = this.inputDevicesList.get(selectedInputDeviceId);
  this.selectedInputDevice.onmidimessage = this.handleMIDIMessage.bind(this);
  console.log('Input port', selectedInputDeviceId);
}

onMidiOutputPortSelected(selection) {
  if (this.selectedOutputDevice) {
    this.selectedOutputDevice.close();
  }

  const selectedOutputDeviceId = selection.target.value;

  this.selectedOutputDevice = this.outputDevicesList.get(selectedOutputDeviceId);
  console.log('Output port', selectedOutputDeviceId);
}
```

### Receiving and Sending messages

Every time there's an incoming MIDI message from the selected input device, the `handleMIDIMessage` is executed. The event is a `MIDIMessageEvent`, it has a `data` property which is a Unit8Array containing the **command**, **note**, and **velocity**.

With the power of [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) I extract the array values as individual variables and then:

1. Log the message properties to the console
1. Verify that the incoming message is a _note on_ command
1. Change the body's background color, because I couldn't think of anything cooler than that ¯\\_(ツ)_/¯
1. Send back that same command and note to the selected output device

```js
handleMIDIMessage(event) {
  const [command, note, velocity] = event.data;
  console.log([command, note, velocity]);

  if(command === 144) {
    // a method to change the body's background color on each key press, not related to Web MIDI
    uiStuff.changeBackgroundColor(note);
  
    if(this.selectedOutputDevice) {
      this.selectedOutputDevice.send([command, note, 10]);
    }

  }
}
```

You may have noticed that I'm passing a static `10` as the **velocity** for every message. It turns out that when you send a `144` **command** and a `10` as the value for the **velocity** to the MIDI Launchpad that I have, it makes the key associated with that **note** light red. Different values will trigger different colors, but those are defined by the vendor, so your device may differ.


## The code

Check out the repo https://github.com/UnJavaScripter/web-midi-basics

You will notice that I used TypeScript, if you use it I recommend you install [`@types/webmidi`](https://www.npmjs.com/package/@types/webmidi). Afterwards you can use it by calling `WebMidi.**thing**`.

If for some reason you don't like TypeScript, that's Okay too. I made TypeScript compile to ES2017 so you can check the [JavaScript code](https://github.com/UnJavaScripter/web-midi-basics/blob/master/dist/app.js) without any weird additions.


## The demo

Here: https://unjavascripter-web-midi-basics.glitch.me/

## Browser Support

You can use the Web MIDI API in Chromium based browsers: https://caniuse.com/#search=web%20midi%20api

## Things to read
You should definitely go over the W3C draft for the Web MIDI API https://webaudio.github.io/web-midi-api/
