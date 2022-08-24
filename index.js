
const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');
const codigoqr = require('qrcode-terminal');
//const fetch = import('node-fetch');
//const  fs  = require('fs');
const clever =require('cleverbot-free');
//const chatbot = require('espchatbotapi'); DEPRECADO TEMPORALMENTE POR SER MUY BASICO EN RESPUESTAS
//chatbotespanol = new chatbot('default','default')//('token','identificador') DEPRECADO TEMPORALMENTE POR SER MUY BASICO EN RESPUESTAS


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
    console.log('se inicia sesion, por favor escanee el qr de arriba');
});
cliente.on('ready',()=>{
    console.log('cliente inicializado, ya se puede operar');
})

cliente.on('auth_failure', (errorAutenticacion) => {
     console.log('fallo el inicio de sesion porque: ',errorAutenticacion)
    // connectionLost()
});



//para recibir y escuchar los mensajes entrantes
cliente.on('message',mensajeEntrante => {
    let cuerpoMensaje = mensajeEntrante.body;
    console.log(mensajeEntrante.body);
    let nombreNotificacion = mensajeEntrante._data.notifyName;
    console.log(nombreNotificacion);
    let numeroEmisor=mensajeEntrante.from;
    console.log(mensajeEntrante.from);
    console.log(mensajeEntrante.to);

    var ahora = new Date() //se ha subido aqui, sacado del primer if porque solo debe responder el bot si es muy tarde
    /**

chatbotespanol.obtener("hola").then(respuesta => {
    console.log(respuesta) //respuesta al texto
}).catch(err => {
  console.log(err) //Solo saltara si hay un error mandando el error a la consola
})
     * 
     */
    
    
    if(mensajeEntrante.body.toLowerCase().search(/hola/)>=0){//si el mensaje viene con la palabra hola responde un saludo al azar

        var arrayRespuestas=[
            `estas bien?, un gusto saludarte ${nombreNotificacion}`,
            `son las ${ahora.getHours()}:${ahora.getMinutes()} en este momento, en serio me escribes a esta hora ${nombreNotificacion}?`,
            `palabras, siempre palabras. por que no me dices de una vez que quieres ${nombreNotificacion}?`,
            `${nombreNotificacion}, podrias mejorar lo que me dices`,
            `primero el mensaje de saludos, bien ${nombreNotificacion}`
        ]
        mensajeRespuestaSaludoAzar=arrayRespuestas[Math.floor(Math.random()*arrayRespuestas.length)]
        cliente.sendMessage(mensajeEntrante.from,mensajeRespuestaSaludoAzar);
        console.log(mensajeRespuestaSaludoAzar);
        
    }else if(cuerpoMensaje.toLowerCase().search(/nota/)>=0){//si en el mensaje existe la palabra nota da instrucciones para recibir notas
        cliente.sendMessage(numeroEmisor,`${nombreNotificacion}, si deseas saber notas debes de ahora ingresar solo tu rut, sin puntos ni guión, en caso de terminar en k reemplácelo con un 1, ej: el rut 12.345.678-k se escribe 123456781. SI NO LO HACE CORRECTAMENTE SU PETICION SERA ANULADA E IGNORADA (Puede que se responda con cualquier cosa absurda)`);
    }else if(!isNaN(cuerpoMensaje)){//si escribe un numero se toma como un rut y se analiza si se puede sacar las notas
        var RUT=cuerpoMensaje.replace(/[\.,-]/g,'')//no tiene sentido el    .replace(/k/gi,'1')
        cliente.sendMessage(numeroEmisor,'Espere un momento mientras reviso sus datos. si no respondo en un tiempo prudencial puede volver a intentarlo enviando nuevamente su rut');
        cliente.sendMessage(numeroEmisor,fetch('https://thesimpsonsquoteapi.glitch.me/quotes?character=homer') /**HAY QUE ESTUDIAR ESTE COMANDO */
                                        .then( respuestaAPI=>{
                                            return respuestaAPI.json();
                                        })
                                        .then(async respuestaPromesaAPI=>{
                                            await cliente.sendMessage(numeroEmisor,respuestaPromesaAPI.toString())
                                        })
                                        .catch(errorQuery=>{
                                            cliente.sendMessage(numeroEmisor,'error de peticion al servidor: '+errorQuery);
                                        }))
        console.log(RUT);
    }else{
        //mensajeCleverbot=clever(mensajeEntrante.body.toLowerCase()).then(respuestaclever);
        //console.log(mensajeCleverbot);
        //cliente.sendMessage(mensajeEntrante.from,"no dijiste hola");

        /**contesta cleverbot */
        clever(cuerpoMensaje).then(async respuestacleverBot=>{
            await console.log('respuesta cleverbot: '+ respuestacleverBot);
            cliente.sendMessage(numeroEmisor,respuestacleverBot)
        })
        .catch(errorCleverbot=>{
            console.log(errorCleverbot);
            cliente.sendMessage(numeroEmisor,`Por el momento tengo problemas para responder. escribeme mas tarde ${nombreNotificacion}`);
        });

        /**contesta chatbot en español DEPRECADO TEMPORALMENTE POR SER MUY BASICO EN RESPUESTAS */ 
        /*
        chatbotespanol.obtener(cuerpoMensaje).then(respuestaChatbotEspanol=>{
            console.log('respuesta chatbot español: '+respuestaChatbotEspanol);
            cliente.sendMessage(numeroEmisor,respuestaChatbotEspanol);
        }).catch(errorRespuestahatbotEspanol=>{
            console.log(errorRespuestahatbotEspanol);
            cliente.sendMessage(numeroEmisor,`${nombreNotificacion}, por el momento tengo problemas para responder. escribeme mas tarde`);
        }
        );
        */
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