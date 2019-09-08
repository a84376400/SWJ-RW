let wsSocket
let preSendSet
const ipArray2ipStr = (array) => {
  
  let arrayStr = array[0]+'.'+array[1]+'.'+array[2]+'.'+array[3]
  return arrayStr
}

const current2Str = (currentLow, currentHigh) => {

  let str = ''
  let len1 = currentLow.length
  let len2 = currentHigh.length
  if(len1 == len2){
    for(let i = 0; i < len1; i++){
      str += `${currentLow[i]}~${currentHigh[i]}  `
    }
  }
  return str
}

const fillORModifyTable = (deviceData) => {
  if(deviceData.sn){
    document.getElementsByClassName('_sn')[0].innerHTML = deviceData.sn
  }
  if(deviceData.TerinalIP){
    document.getElementsByClassName('_terinalIP')[0].innerHTML = ipArray2ipStr(deviceData.TerinalIP) 
  }
  if(deviceData.nbSN){
    document.getElementsByClassName('_nbSN')[0].innerHTML = deviceData.nbSN
  }
  if(deviceData.Temperature_High && deviceData.Temperature_Low){
    document.getElementsByClassName('_temperatureRange')[0].innerHTML = `${deviceData.Temperature_Low}~${deviceData.Temperature_High}`
  }
  if(deviceData.version){
    document.getElementsByClassName('_version')[0].innerHTML = deviceData.version
  }
  if(deviceData.serverIP){
    document.getElementsByClassName('_serverIP')[0].innerHTML = ipArray2ipStr(deviceData.serverIP) 
  }
  if(deviceData.nb){
    document.getElementsByClassName('_nb')[0].innerHTML = deviceData.nb
  }
  if(deviceData.channel){
    document.getElementsByClassName('_channel')[0].innerHTML = deviceData.channel
  }
  if(deviceData.GatewayIP){
    document.getElementsByClassName('_gatewayIP')[0].innerHTML = ipArray2ipStr(deviceData.GatewayIP) 
  }
  if(deviceData.Temperature_differ){
    document.getElementsByClassName('_temperatureDiffer')[0].innerHTML = deviceData.Temperature_differ
  }
  if(deviceData.Voltage_Low && deviceData.Voltage_High){
    document.getElementsByClassName('_voltage')[0].innerHTML = `${deviceData.Voltage_Low}~${deviceData.Voltage_High}`
  }
  if(deviceData.Current_Low && deviceData.Current_High){
    document.getElementsByClassName('_current')[0].innerHTML = current2Str(deviceData.Current_Low, deviceData.Current_High)
  }
  if(deviceData.Light_Power){
    document.getElementsByClassName('_lightPower')[0].innerHTML = deviceData.Light_Power
  }
  if(deviceData.udp){
    loadIP(ipArray2ipStr(deviceData.udp))
  }
}

const wsinit = () => {
  wsSocket = new WebSocket('ws://localhost:3001')
  preSendSet = new Set()
  wsSocket.onopen = event => {
    
  }
  wsSocket.onclose = event => {
    
  }
  wsSocket.onmessage = data => {
    let deviceData = JSON.parse(data.data)
    //一旦接收到server端的数据，即表示读取设备的信息成功
    //对页面进行数据填充和修改
    //console.log(deviceData）
    console.log(deviceData)
    fillORModifyTable(deviceData)
  }
}

const sendWS = (data)=>{
  //在发送ws之前首先对数据进行序列化
  if(wsSocket){
    wsSocket.send(JSON.stringify(data))
  }
}

const loadIP = (ipStr)=>{
  let oUl = document.getElementsByClassName("jd-clo1")[0];
  //console.log(oUl.getElementsByTagName('ul'))
  let str =
  `<ul>
    <li class='ip_li'><a href='#'>${ipStr}</a></li>
  </ul>`

  oUl.innerHTML += str
  onClickListen()
}

const checkInput = () => {
//todo
}

const fetchDeviceData = (ip)=>{
  //发送读取设备信息的指令
  localStorage.setItem('ip',ip)
  sendWS({
    operateName: 'readDeviceConfig',
    HOST: ip
  })
  setTimeout(()=>{
    sendWS({
      operateName: 'readDeviceParam',
      HOST: ip
    })
  },500)

}

const setDevice = (flag,dom)=>{
  let ip = localStorage.getItem('ip')
  // console.log(flag)
  //console.log(dom.getAttribute('flag'))
  //根据flag 生成ws 发送对象
  let inputValues
  switch(flag){
    case 'setSN':
      sendWS({
        operateName: flag,
        HOST: ip,
        SN: 'SN'+ dom.parentNode.children[0].value
      })
    break
    case 'setTempDiff':
      sendWS({
        operateName: flag,
        HOST: ip,
        Temperature_differ: parseInt(dom.parentNode.children[0].value)
      })
    break
    case 'setServerIP':
      sendWS({
        operateName: flag,
        HOST: ip,
        serverIP: (dom.parentNode.children[0].value).split(".").map(item => {
          return +item;  
        })
      })
    break
    case 'setGateway':
      sendWS({
        operateName: flag,
        HOST: ip,
        gateway: (dom.parentNode.children[0].value).split(".").map(item => {
          return +item
        })
      })
    break
    case 'setTempthreshold':
      let Temperature = []
      Temperature.push(parseInt(dom.parentNode.children[0].value))
      Temperature.push(parseInt(dom.parentNode.children[1].value))
      sendWS({
        operateName: flag,
        HOST: ip,
        Temperature: Temperature,
      })
    break
    case 'setVolt':
      let Voltage = []
      Voltage.push(parseInt(dom.parentNode.children[0].value))
      Voltage.push(parseInt(dom.parentNode.children[1].value))
      sendWS({
        operateName: flag,
        HOST: ip,
        Voltage: Voltage
      })
    break
    case 'setCurrentVALUE':
      let CurrentVALUE = []
      CurrentVALUE.push(parseInt(dom.parentNode.children[1].value))
      CurrentVALUE.push(parseInt(dom.parentNode.children[2].value))
      sendWS({
        operateName: flag,
        HOST: ip,
        channel: parseInt(dom.parentNode.children[0].value),
        CurrentVALUE: CurrentVALUE
      })
    break
    case 'setChannel':
      sendWS({
        operateName: flag,
        HOST: ip,
        channel: parseInt(dom.parentNode.children[0].value),
        cameraNUM: parseInt(dom.parentNode.children[1].value),
        NB: parseInt(dom.parentNode.children[2].value)
      })
    break
    case 'setDeviceIP':
      sendWS({
        operateName: flag,
        HOST: ip,
        deviceIP: (dom.parentNode.children[0].value).split(".").map(item => {
          return +item;  
        })
      })
    break
    case 'search':
      fetchDeviceData(dom.parentNode.children[0].value)
    break
  }
}

const allset = (e) => {
  console.log('正在进行一键设定')
  console.log(preSendSet)
  //首先将preSendSet的ip存入localStorage中
  localStorage.setItem('ip', preSendSet)
}

const gotoPreSet = (ip) => {
  console.log(`${ip}进入准备批量设置的缓存`)
  //首先构建去重数组
  preSendSet.add(ip)
}

const onClickListen = ()=>{
  //对ip列表添加单击监听以及双击监听
  let ip_li = document.getElementsByClassName("ip_li")
  for(let i = 0; i < ip_li.length; i++) {
    ip_li[i].ondblclick = ()=>{
      fetchDeviceData(ip_li[i].firstChild.innerHTML)
    }
    ip_li[i].onclick = ()=>{
      gotoPreSet(ip_li[i].firstChild.innerHTML)
    }
  }
  //对修改按钮添加监听
  let buttons = document.getElementsByTagName('button')
  for(let i =0; i < buttons.length; i++){
    buttons[i].onclick = ()=>{
      setDevice(buttons[i].getAttribute('flag'), buttons[i])
    }
  }
  //对一键设定按钮进行监听
  let allSet_a = document.getElementsByClassName("allset")[0]
  allSet_a.onclick = () => {
    allset()
  }
}
wsinit()