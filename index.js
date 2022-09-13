const { Client, LocalAuth,MessageMedia,Buttons, List } = require("whatsapp-web.js");
const express = require('express');
const appExpress = express();
const codigoqr = require("qrcode-terminal");
const fs = require("fs");
const clever = require("cleverbot-free");
const validadorEmail = require('email-validator')
const { validate, clean, format, getCheckDigit } = require('rut.js')
const validaRut = (rut)=>{return validate(rut)}
//const fetch = require("isomorphic-fetch");
//modulos propios externos
const {cambioEmail,envioNotas} = require('./API_servicios/APIservicios')

//seccion express de experimentacion para implementar ya a produccion
const puerto=process.env.PORT||3000
appExpress.get('/',(requerimiento,respuesta)=>{
    //console.log('iniciando express');
    respuesta.send('pagina en linea');
    //console.log('respuesta enviada');
});
appExpress.get('/qr',(qr,respuesta)=>{
    respuesta.send('pagina de qr');
});




//nueva forma de autenticarse.
//ya no se necesitan archivos de sesiones
// porque los guarda localmente
cliente = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
});

//aqui se genera el codigo qr
//SOLO si no estan los datos guardados en local
cliente.on("qr", (qr) => {
  console.log("no habia sesion iniciada");
  codigoqr.generate(qr, { small: true });
  console.log("se inicia sesion, por favor escanee el qr de arriba");
});
cliente.on("ready", () => {
  console.log("cliente inicializado, ya se puede operar");
});

cliente.on("auth_failure", (errorAutenticacion) => {
  console.log("fallo el inicio de sesion porque: ", errorAutenticacion);
  // connectionLost()
});

//para recibir y escuchar los mensajes entrantes
cliente.on("message", (mensajeEntrante) => {//procesos de respuestas segun mensajes
  let cuerpoMensaje = mensajeEntrante.body;
  console.log(mensajeEntrante.body);
  let nombreNotificacion = mensajeEntrante._data.notifyName;
  (nombreNotificacion.toLowerCase().search(/</)>=0)?nombreNotificacion='Estimado estudiante':
  console.log(nombreNotificacion);
  let numeroEmisor = mensajeEntrante.from;
  console.log(mensajeEntrante.from);
  console.log(mensajeEntrante.to);

  var ahora = new Date(); //PROCESO PENDIENTE: se ha subido aqui, sacado del primer if porque solo debe responder el bot si es muy tarde

  if (cuerpoMensaje.toLowerCase().search(/hola/) >= 0) {//si el mensaje viene con la palabra hola responde un saludo al azar
    var arrayRespuestas = [
      `estas bien?, un gusto saludarte ${nombreNotificacion}`,
      `son las ${ahora.getHours()}:${ahora.getMinutes()} en este momento, en serio me escribes a esta hora ${nombreNotificacion}?`,
      `palabras, siempre palabras. por que no me dices de una vez que quieres ${nombreNotificacion}?`,
      `${nombreNotificacion}, podrias mejorar lo que me dices`,
      `primero el mensaje de saludos, bien ${nombreNotificacion}`,
    ];
    mensajeRespuestaSaludoAzar =
      arrayRespuestas[Math.floor(Math.random() * arrayRespuestas.length)];
    cliente.sendMessage(mensajeEntrante.from, mensajeRespuestaSaludoAzar);
    cliente.sendMessage(numeroEmisor,`Si deseas saber que puedo hacer por ti puedes escribir **opciones** para saberlo`)
    console.log(mensajeRespuestaSaludoAzar);
  } else if (cuerpoMensaje.toLowerCase().search(/nota/) >= 0) {//si en el mensaje existe la palabra nota da instrucciones para recibir notas
    cliente.sendMessage(
      numeroEmisor,
      `${nombreNotificacion}, si deseas saber notas debes de ahora ingresar solo tu rut, sin puntos ni guión, en caso de terminar en k reemplácelo con un 1, ej: el rut 12.345.678-k se escribe 123456781. si eres extranjero, no escribas el 100. SI NO LO HACE CORRECTAMENTE SU PETICION SERA ANULADA E IGNORADA (Puede que se responda con cualquier cosa absurda)`
    );
  } else if (!isNaN(cuerpoMensaje)&&validaRut(cuerpoMensaje)) {//envio de notas usando solo el rut
    envioNotas(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje)
        //envioNotas(cliente,nombreNotificacion,cuerpoMensaje)
    /**
     * operacion suspendida para extraer desde modulo externo
     */
    /*
    //si escribe un numero se toma como un rut y se analiza si se puede sacar las notas
    var RUT = cuerpoMensaje.replace(/[\.,-]/g, ""); //no tiene sentido el    .replace(/k/gi,'1')
    cliente.sendMessage(
      numeroEmisor,
      "Espere un momento mientras reviso sus datos."
    );
    const urlApiNotas =
      "https://script.google.com/macros/s/AKfycbyYYD23WAZ2_XBfRBgbeX4R5XqCwbfaPvrYkKQ38Dh7J3oPGKKQqv-3l8m8XxR_OaEKoQ/exec?sdata=";
    fetch(urlApiNotas + cuerpoMensaje)
      .then((respuestaApiNotas) => {
        return respuestaApiNotas;
      })
      .then((direccionObtenida) => {
        fetch(direccionObtenida.url)
          .then((respuestadeDireccion) => {
            return respuestadeDireccion.text();
          })
          .then((respuestaTextodeDireccion) => {
            //recibo el string html
            if (
              respuestaTextodeDireccion !== "Estudiante no existe, reintente"
            ) {
              var nombreArchivomedia = `informe notas de fisica solicitado por ${nombreNotificacion} al ${ahora.getDate()}-${ahora.getMonth()}-${ahora.getFullYear()}.html`;
              var pathFileNombrearchivo = `./informes/${nombreArchivomedia}`;
              //escribo el archivo localmente
              new MessageMedia(
                fs.writeFile(
                  pathFileNombrearchivo,
                  respuestaTextodeDireccion,
                  (errorescrituraArchivo) => {
                    console.log(errorescrituraArchivo);
                  }
                )
              );
              //envio el archivo del informe dandole un tiempo de espera
              setTimeout(async () => {
                var archivomedia = MessageMedia.fromFilePath(
                  `./informes/${nombreArchivomedia}`
                );
                await cliente.sendMessage(numeroEmisor, archivomedia);
                //ahora borro el achivo generado
                await fs.unlinkSync(pathFileNombrearchivo);
              }, 10000);
            } else {
              cliente.sendMessage(
                numeroEmisor,
                "Estudiante no existe, verifique los datos y reintente. Si el problema persiste escriba a dcornejo@liceotecnicotalcahuano.cl indicando su rut, nombre y curso"
              );
            }
          })
          .catch((errorDireccionObtenida) => {
            console.log(
              "error de direccion obtenida url porque: " +
                errorDireccionObtenida
            );
          });
      })
      .catch((errorApiNotas) => {
        cliente.sendMessage(numeroEmisor,`Tuve problemas con tu solicitud. por: ${errorApiNotas}. Intente de nuevo, si el problema persiste favor reenvie este mensaje a dcornejo@liceotecnicotalcahuano.cl`)
        console.log("error en la api de notas porque: " + errorApiNotas);
      });
    //cliente.sendMessage(numeroEmisor,apirespuestafinal.toString());
    */
    /**
     * 
     */
  } else if (cuerpoMensaje.toLowerCase().search(/boton/) >= 0) {//podria usarse aqui para un menu con la palabra ayuda
    mensajeEntrante.reply("quieres boton"); //responderal mensaje
    let boton=new Buttons('mensajeboton',[{body:'cuerpoboton'},{body:'cuerpoboton2'}],'titulo','footer');
    console.log(boton)
    mensajeEntrante.reply(boton)
    cliente.sendMessage(numeroEmisor,boton)//********falla opcion de envio, revisar */
    cliente.sendMessage(numeroEmisor,"mande botones")
  } else if (cuerpoMensaje.toLowerCase().search(/lista/)>=0) {//envio de lista de itemes. parece no funcionar
    console.log('inicio de proceso de lista')
    let secciones =[{title:'secciontitulo',rows:[{title:'item1',description:'descripcion'},{title:'item2'}]}];
    let lista = new List('cuerpo de lista','btnText',secciones,'titulo','footer');
    cliente.sendMessage(numeroEmisor,lista);
    console.log('fin proceso de lista')
  } else if (cuerpoMensaje.toLowerCase().search(/adios/) >= 0) {//despedida con mensaje final
    mensajeEntrante.reply(
      "Chao. Para mas información visita cuando quieras https://www.profedaniel.cf"
    );
  } else if (cuerpoMensaje.toLowerCase().search(/email/)>=0){//instrucciones de cambio de email en la base de datos
    console.log('inicio de envio de  INSTRUCCIONES DE  cambio de email');
    cliente.sendMessage(numeroEmisor,`${nombreNotificacion}, para cambiar tu email en el que recibes las notas debes escribir ahora tu rut sin puntos ni guion seguido de una coma y el nuevo email. SIN ESPACIOS o su solicitud será rechazada. En caso que su rut termine en k reemplácelo por un 1. Si es extranjero no escriba el 100 \n ej: 123456781,nuevocorreo@gmail.com`)
  } else if(cuerpoMensaje.toLowerCase().search(/@/)>=0){
    //se analiza si esta correcto el mensaje
    let rutconEmail = cuerpoMensaje.toLowerCase().split(',')
    //regex del rut
    let RUT = rutconEmail[0].replace(/[\.,-]/g, "");
    console.log(RUT);
    var nuevoEmailalumno = rutconEmail[1].replace(" ","")
    console.log(nuevoEmailalumno);
    if (validadorEmail.validate(nuevoEmailalumno)){
      console.log(`${nuevoEmailalumno} es un email valido`);
      cambioEmail(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje);
    }
  } else if (cuerpoMensaje.toLowerCase().search(/opciones/)>=0){//opciones del bot y sus acciones
    cliente.sendMessage(numeroEmisor,`Opciones: ${nombreNotificacion} escribe en palabras tu solicitud segun lo que quieras hacer\n`+
                                      '1.- escribe **opciones** para volver a ver este mensaje\n'+
                                      '2.- puedes **pedir tus notas** simplemente escribiéndolo\n'+
                                      '3.- pideme **cambiar tu email** para cambiar tu correo para recibir resultados de las pruebas')
  } else {/**contesta cleverbot */
    clever(cuerpoMensaje)
      .then(async (respuestacleverBot) => {
        await console.log("respuesta cleverbot: " + respuestacleverBot);
        cliente.sendMessage(numeroEmisor, respuestacleverBot);
      })
      .catch((errorCleverbot) => {
        console.log(errorCleverbot);
        cliente.sendMessage(
          numeroEmisor,
          `Por el momento tengo problemas para responder. escribeme mas tarde ${nombreNotificacion}`
        );
      });
  }
});

cliente.initialize();
appExpress.listen(puerto,()=>{console.log(`escuchando en https://localhost:${puerto}`)});

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





  wwebjssender fallido
  const WwebjsSender = require('@deathabyss/wwebjs-sender')
  let embebido= new WwebjsSender.MessageEmbed()
    .sizeEmbed(28)//numero estandar
    .setTitle("✅ | Titulo embebido process!") //titulo
    .setDescription("descripcion del embebido")//descripcion
    .addField("✔", "para confirm")//agrega un campo
    .addField("❌", "To cancel")//agrega un segundo campo
    .addFields({//agrega un campo con detalles especificos
      name: "Now you have 2 buttons to choose!",
      value: "✔ or ❌",
    })
    .setFooter("footer usando WwebjsSender")//incluye footer
    .setTimestamp(); //imagino que es la marca de tiempo de este uso

    //ahora los botones
    let boton1=new WwebjsSender.MessageButton()
    .setCustomId("id custom ")//un id no generico usado por mi
    .setLabel("contenido boton ❌");
    let boton2=new WwebjsSender.MessageButton()
    .setCustomId("id2")
    .setLabel("boton 2 ❌")

    //se envia el boton supuestamente
    WwebjsSender.send({
        client:cliente,
        number:numeroEmisor,
        embed:embebido,
        button:[boton1,boton2]
    });
 */
