const usb = require('usb')
const log = require('./modules/log')


/** Constants, Panda USB VendorID & ProductID */
const VID = '0xbbaa'
const PID = '0xddcc'
const USB_DEBUG_LEVEL = 1

/** Set debug level for usb library */
usb.setDebugLevel(USB_DEBUG_LEVEL)
// log('** usb object ***\n\n', usb)

/** Get device connected usb devices */
let devices = usb.getDeviceList()

/** Retrieve the panda usb device by id */
const panda = usb.findByIds(VID, PID)

/** Exit if panda not found by id */
if (!panda) {
  throw new Error('Panda usb device not found')
}

// log('panda object:', panda)

/** Store usb device open status */
let pandaDeviceStatus

try {
  log('Attempting to open panda.........\n')
  panda.open()
  pandaDeviceStatus = true

} catch(e) {
  console.error('\n\n** Error caught opening panda ** \n\n', e)
  pandaDeviceStatus = false
}

log('Panda open?', pandaDeviceStatus)

const _handle = panda.interface(0)

// console.info('\n\n**Panda - _handle **\n', _handle)

/** Claim interface 0 on the panda */
log('Attempting to claim _handle (pi0) interface...')
_handle.claim()

/** Check if kernal driver is active, should be false typically. */
// log('_handle.isKernelDriverActive()? **', _handle.isKernelDriverActive())


/** Store the endpoints for easier access */
const panda_in = _handle.endpoints[0] /* Device -> PC */
const panda_out1 = _handle.endpoints[1] /* PC -> Device */
const panda_out2 = _handle.endpoints[2] /* PC -> Device */

// log('panda_in\n', panda_in)
// log('panda_in.direction', panda_in.direction)
// log('panda.controlTransfer? **\n\n', panda.controlTransfer)
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

/** Callback for processing the health data retrieved from Panda */
const _getHealth = (error, data) => {
  console.info('\n---------------------------------------------')
  error && console.error('_getHealth error', error)
  const { data: d } = data.toJSON()
  log('_getHealth - d', d)
  const result = {
    "voltage": d[0],
    "current": d[1],
    "started": d[2],
    "controls_allowed": d[3],
    "gas_interceptor_detected": d[4],
    "started_signal_detected": d[5],
    "started_alt": d[6]
  }
  log('Panda Health (May not be interpreted correctly, in progress)\n\n', result)
}

/** Callback for is Grey Model Panda */
const _isGrey = (error, data) => {
  console.info('\n---------------------------------------------')
  error && console.error('_isGrey error', error)
  const { data: d } = data.toJSON()
  log('_isGrey - d', d)
  log('Panda is Grey Model?', d && d[0] === 1 ? 'TRUE' : 'FALSE')
}


////////////////
// Test Reads //
////////////////


/** Attempt to get panda secret */
panda.controlTransfer(
  0xc0,
  0xd0,
  1,
  0,
  0x10,
  _callback.bind({}, 'Panda Get Secret')
)

/** Attempt to get panda serial */
panda.controlTransfer(
  0xc0,
  0xd0,
  0,
  0,
  0x20,
  _callback.bind({}, 'Panda Get Serial')
)

/** Attempt to get panda health info */
panda.controlTransfer(
  0xc0,
  0xd2,
  0,
  0,
  13,
  _getHealth
)

/** Attempt to check if panda is grey model */
panda.controlTransfer(
  0xc0,
  0xc1,
  0,
  0,
  0x40,
  _isGrey
)

/** Attempt to get panda version */
panda.controlTransfer(
  0xc0,
  0xd6, /* 0xd6 is the type for version info */
  0,
  0,
  0x40,
  _callback.bind({}, 'Panda Version')
)


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
