const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const dgram = require('dgram')
const ws = require('nodejs-websocket')
const net = require('net')
const config = require('./config')
const { HEXCOUNT, HEXPARSE, parse_ip } = require('./hex')
const cache = require('memory-cache')
const _ = require('lodash')
//const globalShortcut = require('global-shortcut');

const dataCache = new cache.Cache();

var client
var deviceData
var wsServer

const boardcast = (data) => {
  wsServer.connections.forEach(conn=>{
    conn.sendText(JSON.stringify(data))
  })
}
const createConnection = (PORT,HOST) => {
    client = new net.Socket()
    client.connect(PORT, HOST)
    client.on('data',(data) => {
      //当设备向客户端发送数据时被调用
      //console.log(data)
      //在解析hex之前获取缓存中channel
      //交互logic 重构 （只有读取指令deviceData不为空 而其它设置指令返回一个空对象）
      deviceData = HEXPARSE(data,dataCache)
      //console.log(deviceData)
      if(!_.isEmpty(deviceData)){
        if(deviceData.channel){
          //此时是readDeviceConfig 或者setChannel命令的返回数据 
          //存储该指令的channel
          dataCache.put(`SN:${deviceData.sn}/channel`, deviceData.channel )
        }
      }
      
      //将deviceData的数据通过ws推送到前端
      if(!_.isEmpty(deviceData)){
        boardcast(deviceData)
      }
      client.destroy()
    })
    client.on('error',()=>{
      console.log('tcp error')
      client.destroy()
    })
    client.on('close',()=>{
      client.destroy()
    })
  }

const sendHexByTcp = (args) => {
  let buffer,buf
  let { HOST, operateName, SN, channel, NB, cameraNUM, deviceIP, serverIP, gateway, Temperature, Temperature_differ, Voltage, CurrentVALUE, CameraIP } = args
  createConnection(PORT = 9527,HOST)
  switch (operateName) {
    case 'setSN':
       buffer = Buffer.concat([
        config.START,
        Buffer.from([0x14]),
        config.CMD.SET_SN,
        Buffer.concat([config.SNLEN, Buffer.from(SN) ]),
        Buffer.from([0x14 + 0x01+ HEXCOUNT(SN)]),
        config.STOP
      ]
      )
      client.write(buffer)
      break

    case 'readDeviceConfig':
       buffer = Buffer.concat([
        config.START,
        Buffer.from([6]),
        config.CMD.READ_DEVICECONFIG,
        Buffer.from([0x00]),
        Buffer.from([0x06 + 0xAA]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'readDeviceParam':
       buffer = Buffer.concat([
        config.START,
        Buffer.from([6]),
        config.CMD.READ_DEVICEPARAM,
        Buffer.from([0x00]),
        Buffer.from([0x06 + 0xAB]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setChannel':
       buffer = Buffer.concat([
        config.START,
        Buffer.from([8]),
        config.CMD.SET_CHANNEL,
        Buffer.concat([Buffer.from([channel]), Buffer.from([cameraNUM]), Buffer.from([NB])]),
        Buffer.from([0x08 + 0x02 + Buffer.from([channel])[0] + Buffer.from([cameraNUM])[0] + Buffer.from([NB])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setDeviceIP':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x09]),
        config.CMD.SET_DEVICEIP,
        Buffer.concat([Buffer.from([deviceIP[0]]), Buffer.from([deviceIP[1]]), Buffer.from([deviceIP[2]]), Buffer.from([deviceIP[3]])]),
        Buffer.from([0x09 + 0x03 + Buffer.from([deviceIP[0]])[0] + Buffer.from([deviceIP[1]])[0] + Buffer.from([deviceIP[2]])[0] + Buffer.from([deviceIP[3]])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setServerIP':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x09]),
        config.CMD.SET_SERVERIP,
        Buffer.concat([Buffer.from([serverIP[0]]), Buffer.from([serverIP[1]]), Buffer.from([serverIP[2]]), Buffer.from([serverIP[3]])]),
        Buffer.from([0x09 + 0x04 + Buffer.from([serverIP[0]])[0] + Buffer.from([serverIP[1]])[0] + Buffer.from([serverIP[2]])[0] + Buffer.from([serverIP[3]])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setGateway':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x09]),
        config.CMD.SET_GATEWAY,
        Buffer.concat([Buffer.from([gateway[0]]), Buffer.from([gateway[1]]), Buffer.from([gateway[2]]), Buffer.from([gateway[3]])]),
        Buffer.from([0x09 + 0x05 + Buffer.from([gateway[0]])[0] + Buffer.from([gateway[1]])[0] + Buffer.from([gateway[2]])[0] + Buffer.from([gateway[3]])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setTempthreshold':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x07]),
        config.CMD.SET_TEMPTHRESHOLD,
        Buffer.concat([Buffer.from([Temperature[0]]), Buffer.from([Temperature[1]])]),
        Buffer.from([0x07 + 0x06 + Buffer.from([Temperature[0]])[0] + Buffer.from([Temperature[1]])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break
    
    case 'setTempDiff':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([6]),
        config.CMD.SET_TEMPDIFF,
        Buffer.from([Temperature_differ]),
        Buffer.from([0x06 + 0x07 + Buffer.from([Temperature_differ])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break
    
    case 'setVolt':
      buf = Buffer.alloc(4)
      buf.writeIntLE(Voltage[0],0,2)
      buf.writeIntLE(Voltage[1],2,2)
      
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x09]),
        config.CMD.SET_VOLTAGETHRESHOLD,
        buf,
        Buffer.from([0x09 + 0x08 + buf[0] + buf[1] + buf[2] + buf[3]]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setCurrentVALUE':
      buf = Buffer.alloc(4)
      buf.writeIntLE(CurrentVALUE[0],0,2)
      buf.writeIntLE(CurrentVALUE[1],2,2)

      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x0A]),
        config.CMD.SET_ELECTRICTHRESHOLD,
        Buffer.concat([Buffer.from([channel]), buf]),
        Buffer.from([0x0A + 0x0A + Buffer.from([channel])[0] + buf[0] + buf[1] + buf[2] + buf[3]]),
        config.STOP
      ])
      
      client.write(buffer)
      break

    case 'setCameraIP':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x0A]),
        config.CMD.SET_CAMERAIP,
        Buffer.concat([Buffer.from([channel]), Buffer.from([CameraIP[0]]), Buffer.from([CameraIP[1]]), Buffer.from([CameraIP[2]]), Buffer.from([CameraIP[3]])]),
        Buffer.from([0x0A + 0x0B + Buffer.from([channel])[0] + Buffer.from([CameraIP[0]])[0] + Buffer.from([CameraIP[1]])[0] + Buffer.from([CameraIP[2]])[0] + Buffer.from([CameraIP[3]])[0]]),
        config.STOP
      ])
      client.write(buffer)
      break

    case 'setDeviceFixIP':
      buffer = Buffer.concat([
        config.START,
        Buffer.from([0x06]),
        config.CMD.SET_CAMERAFIXIP,
        Buffer.from([0x0F]),
        Buffer.from([0x06 + 0x0F + 0x0F]),
        config.STOP
      ])
      client.write(buffer)
      break
  }
}
let win // 保存窗口对象的全局引用, 如果不这样做, 当JavaScript对象被当做垃圾回收时，window窗口会自动关闭

function createWindow () {
  // 创建浏览器窗口.
  win = new BrowserWindow({width: 1400, height: 800,autoHideMenuBar :true})

  win.setMenu(null);
  // 加载项目的index.html文件.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
  // 当窗口关闭时候的事件.
    slashes: true
  }))

  // 打开开发工具.
  win.webContents.openDevTools()
  win.on('closed', () => {
    // 取消引用窗口对象, 如果你的应用程序支持多窗口，通常你会储存windows在数组中，这是删除相应元素的时候。
    win = null
  })
}

app.on('activate', () => {
  console.log('activate')
  if (win === null) {
    createWindow()
  } else {
    win.show()
  }
})

// 当Electron完成初始化并准备创建浏览器窗口时，将调用此方法
// 一些api只能在此事件发生后使用。
app.on('ready', createWindow)

// 当所有窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在macOS上，用得多的是应用程序和它们的菜单栏，用Cmd + Q退出。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

wsServer = ws.createServer(conn => {
  conn.on('text',(data) => {
    //接收到前端的消息触发
    //console.log(JSON.parse(data))
    sendHexByTcp(JSON.parse(data))
  })
  //关闭
  conn.on('close',() => {
  })
  //webSocket异常
  conn.on('error',() => {
  })

  let server_udp = dgram.createSocket('udp4')
  //项目一启动就去建立UDP通信
  //向指定ip 192.168.1.255:9528发送buffer

  server_udp.on('message',(msg, rinfo) => {
  //set.add(msg.toString('utf8'))
  //接收到设备通过UDP发送过来的数据
  //将16进制数据进行解析
  console.log(msg)
  boardcast({udp: parse_ip(msg)})
  })
  server_udp.on('error',(err) => {
    server_udp.close()
  })
  server_udp.bind(6000)
  //192.168.1.255
  server_udp.send(Buffer.from([0x8E,0x06,0xF1,0x00,0x00,0x00,0xB0,0x9E]),9528, `192.168.${config.getIPAdress().split(".")[2]}.255` )
});

wsServer.listen(3001)