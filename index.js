const usb = require('usb')
const log = require('./modules/log')


/** Constants, Hokuyo USB VendorID & ProductID */
const VID = '0x15d1'
const PID = '0x0'
const USB_DEBUG_LEVEL = 1

/** Set debug level for usb library */
usb.setDebugLevel(USB_DEBUG_LEVEL)
// log('** usb object ***\n\n', usb)

/** Get device connected usb devices */
// let devices = usb.getDeviceList()

// log('devices', devices)

/** Retrieve the usbDevice usb device by id */
const usbDevice = usb.findByIds(VID, PID)

/** Exit if usbDevice not found by id */
if (!usbDevice) {
  throw new Error('Hokuyo usb device not found')
}

log('usbDevice object:', usbDevice)

/** Store usb device open status */
let deviceStatus

try {
  log('Attempting to open device.........\n')
  usbDevice.open()
  deviceStatus = true

} catch(e) {
  console.error('\n\n** Error caught opening device ** \n\n', e)
  deviceStatus = false
}

log('Device open?', deviceStatus)

const _handle = usbDevice.interface(0)

console.info('\n\n** Hokuyo - _handle **\n', _handle)

/** Claim interface 0 on the usbDevice */
log('Attempting to claim _handle (pi0) interface...')
// _handle.claim()

/** Check if kernal driver is active, should be false typically. */
log('_handle.isKernelDriverActive()? **', _handle.isKernelDriverActive())

log('__handle.endpoints', _handle.endpoints)
// /** Store the endpoints for easier access */
const device_in = _handle.endpoints[0] /* Device -> PC */
// const device_out1 = _handle.endpoints[1] /* PC -> Device */
// const device_out2 = _handle.endpoints[2] /* PC -> Device */

// log('device_in\n', device_in)
// log('device_in.direction', device_in.direction)

// log('usbDevice.controlTransfer? **\n\n', usbDevice.controlTransfer)
// log('usb.LIBUSB_ENDPOINT_IN', usb.LIBUSB_ENDPOINT_IN)



/** Generic callback for testing reading from Panda */
const _callback = (message, error, data) => {
  console.info('\n---------------------------------------------')
  error && console.error('_callback - error', error)
  // log(`${message} - data`, data)
  log(`${message}, data.toString():`, data.toString())
  log(`${message} - Buffer data.length`, data.length)
  log(`${message}, data.toJSON():`, data.toJSON())
  console.info('\n\n')
}

/** event data callback */
const _callback_data = data => {
  console.info('\n---------------------------------------------')
  log(`on event - data\n`, data)
  log(`on event - data.toString():`, data.toString())
  log(`on event - data.length Buffer`, data.length)
  log(`on event - data.toJSON():`, data.toJSON())
}

/** event error callback */
const _callback_error = error => {
  console.info('\n---------------------------------------------')
  log(`on event - error\n`, error)
}

/** Device In On Data */
device_in.on('data', _callback_data)

/** Device In On Errpr */
device_in.on('error', _callback_error)



device_in.startPoll()


////////////////
// Test Reads //
////////////////


/** Attempt to get usbDevice version */
// usbDevice.controlTransfer(
//   0xc0,
//   0xd6, /* 0xd6 is the type for version info */
//   0,
//   0,
//   0x40,
//   _callback.bind({}, 'Device Version')
// )
//

/**
 * Notes
 *
 *
 * 0xc0 = 0b11000000 = 192
 *
 * 0x44 = 0b1000100 = 68
 *
 *
 * What is HHBBHHH (controlRead) and HH (bulkRead) ?
 *
 *
 *
 *
 *
 *

  https://docs.python.org/3/library/struct.html
  http://www.cs.unm.edu/~hjelmn/libusb_hotplug_api/group__asyncio.html



  def __init__(self, ip="192.168.0.10", port=1337):
     self.sock = socket.create_connection((ip, port))


  def __recv(self):
     ret = self.sock.recv(0x44)
     length = struct.unpack("I", ret[0:4])[0]
     return ret[4:4+length]


  def controlRead(self, request_type, request, value, index, length, timeout=0):
     self.sock.send(struct.pack("HHBBHHH", 0, 0, request_type, request, value, index, length))
     return self.__recv()


  def bulkRead(self, endpoint, length, timeout=0):
     self.sock.send(struct.pack("HH", endpoint, 0))
     return self.__recv()


  def parse_can_buffer(dat):
     ret = []
     for j in range(0, len(dat), 0x10):
       ddat = dat[j:j+0x10]
       f1, f2 = struct.unpack("II", ddat[0:8])
       extended = 4
       if f1 & extended:
         address = f1 >> 3
       else:
         address = f1 >> 21
       dddat = ddat[8:8+(f2&0xF)]
       if DEBUG:
         print("  R %x: %s" % (address, str(dddat).encode("hex")))
       ret.append((address, f2>>16, dddat, (f2>>4)&0xFF))
     return ret




   // bulkRead(1, 0x10*256)

   def bulkRead(self, endpoint, length, timeout=0):
      self.sock.send(struct.pack("HH", endpoint, 0))
      return self.__recv()


   def can_recv(self):
     dat = bytearray()
     while True:
       try:
         dat = self._handle.bulkRead(1, 0x10*256)
         break
       except (usb1.USBErrorIO, usb1.USBErrorOverflow):
         print("CAN: BAD RECV, RETRYING")
     return parse_can_buffer(dat)



 *
 */
