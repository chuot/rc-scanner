# Configuration file - config.json

```js
{
  "nodejs": {
    // (string) "development" or "production". Default is "production".
    "env": "production",

    // (string) Which IP to bind to? Default is "0.0.0.0"
    "host": "0.0.0.0",

    // (number) Which PORT to bind to? Default is 3000
    "port": 3000,

    // (boolean) Run server in https mode
    "ssl": false,

    // (string) Path to the SSL CA certificate
    // See SSL certificates section below for more details
    "sslCa": "ca.crt",

    // (string) Path to the SSL certificate
    // See SSL certificates section below for more details
    "sslCert": "server.crt",

    // (string) Path to the SSL privat key
    // See SSL certificates section below for more details
    "sslKey": "server.key"
  },

  "rcScanner": {
    "audio": {
      // Which audio device to use. -1 is for default device
      // You can get a list of your audio device with the
      // following command: 'npm server list-audio'
      "deviceId": -1,

      // Reconnect after this amount of milliseconds to the audio
      // device if the naudiodon library has crashed.
      "reconnectInterval": 2000,

      // The sampling rate that match your audio device
      "sampleRate": 44100,

      // PCM squelch value.
      // Below that value, server won't send audio data to client
      // Value of 0 will disable this feature.
      // You should try a value between 0 and 5000. It all depends
      // if you do have ground loop noises or not.
      "squelch": 100
    },

    "com": {
      // The baud rate of the port to be opened. This should match one of
      // the commonly available baud rates, such as 110, 300, 1200, 2400,
      // 4800, 9600, 14400, 19200, 38400, 57600, or 115200. Custom rates
      // are supported best effort per platform. The device connected to
      // the serial port is not guaranteed to support the requested baud
      // rate, even if the port itself supports that baud rate.
      "baudRate": 115200,

      // Must be one of these: 8, 7, 6, or 5.
      "dataBits": 8,

      // Must be one of these: 'none', 'even', 'mark', 'odd', 'space'.
      "parity": "none",

      // Use by some drivers; poll scanner status every x milliseconds.
      "pollingInterval": 250,

      // The system path of the serial port you want to open.
      // For example, /dev/ttyXXX0 on Mac/Linux, or COM1 on Windows.
      "port": "/dev/ttyUSB0",

      // Retry to connect to serial port after this amount of
      // milliseconds.
      "reconnectInterval": 2000,

      // flow control setting.
      "rtscts": false,

      // Must be one of these: 1 or 2.
      "stopBits": 1
    },

    // Some radio scanners display their serial number.
    // Here you can choose not to display the serial number
    // (replaced by zeros) on the client side.
    "hideSerialNumber": true,

    // One of the supported scanner model.
    // Use 'node server list-models' for the list of
    // supported models.
    "model": "bcd386t",

    "webSocket": {
      // Disconnect dead clients after x milliseconds.
      "keepAlive": 30000,

      // The client will try to reconnect to server's websockets
      // every x milliseconds.
      "reconnectInterval": 2000
    }
  }
}
```
