module.exports = {
  START: Buffer.from([0x8E]),
  STOP: Buffer.from([0x9E]),
  SNLEN: Buffer.from([0x0E]),
  CMD: {
    READ_DEVICECONFIG: Buffer.from([0xAA,0x00,0x00]),
    READ_DEVICEPARAM: Buffer.from([0xAB,0x00,0x00]),
    SET_SN: Buffer.from([0x01,0x00,0x00]),
    SET_CHANNEL: Buffer.from([0x02,0x00,0x00]),
    SET_DEVICEIP: Buffer.from([0x03,0x00,0x00]),
    SET_SERVERIP: Buffer.from([0x04,0X00,0X00]),
    SET_GATEWAY: Buffer.from([0x05,0X00,0X00]),
    SET_TEMPTHRESHOLD: Buffer.from([0x06,0x00,0x00]),
    SET_TEMPDIFF: Buffer.from([0x07,0x00,0x00]),
    SET_VOLTAGETHRESHOLD: Buffer.from([0x08,0x00,0x00]),
    SET_ELECTRICTHRESHOLD: Buffer.from([0x0A,0x00,0x00]),
    SET_CAMERAIP: Buffer.from([0X0B,0x00,0x00]),
    SET_DEVICEFIXIP: Buffer.from([0x0F,0x00,0x00]),
  },
  getIPAdress: ()=>{
    var interfaces = require('os').networkInterfaces();  
    for(var devName in interfaces){  
        var iface = interfaces[devName];  
      for(var i=0;i<iface.length;i++){  
          var alias = iface[i];  
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){  
              return alias.address;  
        }
    }
    }
  }  
}