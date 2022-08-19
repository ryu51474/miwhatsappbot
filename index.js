
const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');
const codigoqr = require('qrcode-terminal');
const  fs  = require('fs');

//nueva forma de autenticarse. 
//ya no se necesitan archivos de sesiones
// porque los guarda localmente
cliente = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

//aqui se genera el codigo qr
//SOLO si no estan los datos guardados en
cliente.on('qr',qr => {
    console.log('no habia sesion iniciada');
    codigoqr.generate(qr,{small:true});
    console.log('se inicia sesion');
});
cliente.on('ready',()=>{
    console.log('cliente inicializado');
})

cliente.on('auth_failure', (errorAutenticacion) => {
     console.log('fallo el inicio de sesion porque: ',errorAutenticacion)
    // connectionLost()
});


//para recibir y escuchar los mensajes entrantes
cliente.on('message',mensajeEntrante => {
    console.log(mensajeEntrante.body);
    console.log(mensajeEntrante.from);
    console.log(mensajeEntrante);
    //division segun tipo de mensaje TENGO QUE PENSAR BIEN ESTO
    /* switch(mensajeEntrante.body.toLowerCase()){
        case "hola":
            cliente.sendMessage(mensajeEntrante.from,'respuesta automatica');
            break;
        case "adios":
    }; */
    var arrayRespuestas=[
        'estas',
        'son',
        'palabras',
        'aleatorias',
        'de saludos'
    ]
    
    if(mensajeEntrante.body.toLowerCase().search(/hola/)>=0){//si el mensaje viene con la palabra hola responde un saludo al azar
        cliente.sendMessage(mensajeEntrante.from,arrayRespuestas[Math.floor(Math.random()*arrayRespuestas.length)]);
    }else{
        cliente.sendMessage(mensajeEntrante.from,'no funciono');

    }
})

cliente.initialize();

/**
 * asi se presentan los datos
 
 Message {
  _data: {
    id: {
      fromMe: false,
      remote: '56964289005@c.us',
      id: '3A095D33BED965BCC70D',
      _serialized: 'false_56964289005@c.us_3A095D33BED965BCC70D'
    },
    body: 'Este es un texto con hola en medios',
    type: 'chat',
    t: 1660445891,
    notifyName: 'Daniel Cornejo',
    from: '56964289005@c.us',
    to: '56931242881@c.us',
    self: 'in',
    ack: 1,
    isNewMsg: true,
    star: false,
    kicNotified: false,
    recvFresh: true,
    isFromTemplate: false,
    pollInvalidated: false,
    broadcast: false,
    mentionedJidList: [],
    isVcardOverMmsDocument: false,
    isForwarded: false,
    hasReaction: false,
    ephemeralOutOfSync: false,
    productHeaderImageRejected: false,
    lastPlaybackProgress: 0,
    isDynamicReplyButtonsMsg: false,
    isMdHistoryMsg: false,
    requiresDirectConnection: false,
    pttForwardedFeaturesEnabled: true,
    isEphemeral: false,
    isStatusV3: false,
    links: []
  },
  mediaKey: undefined,
  id: {
    fromMe: false,
    remote: '56964289005@c.us',
    id: '3A095D33BED965BCC70D',
    _serialized: 'false_56964289005@c.us_3A095D33BED965BCC70D'
  },
  ack: 1,
  hasMedia: false,
  body: 'Este es un texto con hola en medios',
  type: 'chat',
  timestamp: 1660445891,
  from: '56964289005@c.us',
  to: '56931242881@c.us',
  author: undefined,
  deviceType: 'ios',
  isForwarded: false,
  forwardingScore: 0,
  isStatus: false,
  isStarred: false,
  broadcast: false,
  fromMe: false,
  hasQuotedMsg: false,
  duration: undefined,
  location: undefined,
  vCards: [],
  inviteV4: undefined,
  mentionedIds: [],
  orderId: undefined,
  token: undefined,
  isGif: false,
  isEphemeral: false,
  links: []
 */