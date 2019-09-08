const _ = require('lodash')

const HEXCOUNT = (SN) => {
  let sum = Buffer.from([SN.length])[0]
  Buffer.from(SN).map((item) => {
    sum += item
  })
  return Buffer.from([sum])[0]
}

const parse_sn = (data_) => {
  let data = ''
  data_.map((item) => {
    data += item.toString()
  })
  return data
}

const parse_ip = (ip_) => {
  var ip = []
  ip_.map((item) => {
    ip.push(item)
  })
  return ip
}

const parseCurrent = (buf, channel) =>{
  //每有一个channel 就读取4个字节 低电流和高电流各占2个字节
  //电流字节默认offest 为62
  let offset = 62, Current_Low = [], Current_High = []
  for(let i = 0; i < channel*2; i+=2) {
    //采用循环去按低位方式解析current
    Current_Low.push(buf.slice(offset, offset+2).readIntLE(0,2)) 
    Current_High.push(buf.slice(offset+2,offset+4).readIntLE(0,2))
    offset += 4
  }
  return {
    Current_Low: Current_Low,
    Current_High: Current_High
  }
}

const HEXPARSE = (buffer,dataCache) => {
  //获取buffer index==2 的数据 来判断操作类型
  const operatName = buffer[2]
  let sn, nb, Camera_IP, Camera_NUM, channel, ccn, TerinalIP, GatewayIP, nbSN, version, serverIP, Temperature_Low, Temperature_High, Temperature_differ, Voltage_Low, Voltage_High, Current_Low, Current_High, Temperature_range, Voltage_range,Light_Power
  switch (operatName) {
    case 0xAA:
      //读取终端设备的配置
      //buffer[6]开始到buffer[20] sn
      sn = buffer.slice(8, 20).toString()
      //是否配置NB模块(0:否，1:是,2:自检)
      nb = buffer.slice(20, 21)[0]
      //获取摄像机数量
      Camera_NUM = buffer.slice(21, 22)[0]
      //控制的路数
      channel = buffer.slice(22, 23)[0]

      return { sn: sn, nb: nb, Camera_NUM: Camera_NUM, channel: channel }
      break
    case 0xAB:
      //该命令读取终端机实时参数
      //sn = parse_sn(buffer.slice(8, 20)) 
      sn = buffer.slice(8, 20).toString()

      version = buffer.slice(21, 26).toString()

      nbSN = buffer.slice(27, 42).toString() //27.42

      nb = buffer.slice(42, 43)[0].toString()

      TerinalIP = parse_ip(buffer.slice(43, 47)) 

      serverIP = parse_ip(buffer.slice(47, 51)) 

      GatewayIP = parse_ip(buffer.slice(51, 55)) 

      Temperature_Low = buffer.slice(55, 56)[0]

      Temperature_High = buffer.slice(56, 57)[0]

      Temperature_differ = buffer.slice(57, 58)[0]

      Voltage_Low = buffer.slice(58, 60).readIntLE(0,2)
      
      Voltage_High = buffer.slice(60, 62).readIntLE(0,2)

      let Current = parseCurrent(buffer, dataCache.get(`SN:${sn}/channel`))

      Current_Low = Current.Current_Low
      
      Current_High = Current.Current_High
      
      Light_Power = buffer.slice(70,71)[0]

      Camera_IP = parse_ip(buffer.slice(71, 75))

      return {
        sn: sn,
        version: version,
        nbSN: nbSN,
        nb: nb,
        TerinalIP: TerinalIP, 
        serverIP: serverIP, 
        GatewayIP: GatewayIP, 
        Temperature_Low: Temperature_Low,
        Temperature_High: Temperature_High,
        Temperature_differ: Temperature_differ,
        Voltage_Low: Voltage_Low,
        Voltage_High: Voltage_High,
        Current_Low: Current_Low,
        Current_High: Current_High,
        Light_Power: Light_Power,
        Camera_IP: Camera_IP
      }
      break
    default: 
      return {}
  }
}

exports.HEXCOUNT = HEXCOUNT
exports.HEXPARSE = HEXPARSE
exports.parse_sn = parse_sn
exports.parse_ip = parse_ip