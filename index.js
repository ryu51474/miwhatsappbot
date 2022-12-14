const { Client, LocalAuth,MessageMedia,Buttons, List } = require("whatsapp-web.js");
const express = require('express');
const appExpress = express();
const codigoqr = require("qrcode-terminal");
const qrcodeweb = require ('node-qr-image')
const clever = require("cleverbot-free");
const validadorEmail = require('email-validator')
const { validate, clean, format, getCheckDigit } = require('rut.js')
const validaRut = (rut)=>{return validate(rut)}
//modulos propios externos
const {cambioEmail,envioNotas,datosEstudiante} = require('./API_servicios/APIservicios')

//seccion express de experimentacion para implementar ya a produccion
const puerto=process.env.PORT||3000
appExpress.get('/',(requerimiento,respuesta)=>{
    //console.log('iniciando express');
    respuesta.send('pagina en linea');
    //console.log('respuesta enviada');
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
  console.log(`se inicia sesion, por favor escanee el qr de arriba o visite http://localhost:${puerto}/qr`);
  appExpress.get('/qr',(req,responseweb)=>{
    let qrEnPagina=qrcodeweb.imageSync(qr.toString(),{type:'svg',size:5})
    responseweb.send(qrEnPagina)
  })
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
  let cuerpoMensaje = mensajeEntrante.body.toLowerCase();
  //console.log(mensajeEntrante.body);
  let nombreNotificacion = mensajeEntrante._data.notifyName;
  (nombreNotificacion.toLowerCase().search(/</)>=0)?nombreNotificacion='Estimado estudiante':nombreNotificacion=nombreNotificacion;
  //console.log(nombreNotificacion);
  let numeroEmisor = mensajeEntrante.from;
  //console.log(mensajeEntrante.from);
  //console.log(mensajeEntrante.to);

  
  if (cuerpoMensaje.search(/hola/) >= 0) {//si el mensaje viene con la palabra hola responde un saludo al azar
    var ahora = new Date(); //PROCESO PENDIENTE: se ha subido aqui, sacado del primer if porque solo debe responder el bot si es muy tarde
    var arrayRespuestas = [
      `estas bien?, un gusto saludarte ${nombreNotificacion}`,
      `son las ${ahora.getHours()}:${ahora.getMinutes()<10?'0':''}${ahora.getMinutes()} en este momento, en serio me escribes a esta hora ${nombreNotificacion}?`,
      `palabras, siempre palabras. por que no me dices de una vez que quieres ${nombreNotificacion}?`,
      `${nombreNotificacion}, podrias mejorar lo que me dices`,
      `primero el mensaje de saludos, bien ${nombreNotificacion}`,
    ];
    mensajeRespuestaSaludoAzar =
      arrayRespuestas[Math.floor(Math.random() * arrayRespuestas.length)];
    cliente.sendMessage(mensajeEntrante.from, mensajeRespuestaSaludoAzar);
    cliente.sendMessage(numeroEmisor,`Si deseas saber que puedo hacer por ti puedes escribir **opciones** para saberlo.`+
                                      `\n Si eres profesor sigue las instrucciones de acceso que te dieron`)
    //console.log(mensajeRespuestaSaludoAzar);
  } else if (cuerpoMensaje.search(/nota/) >= 0) {//si en el mensaje existe la palabra nota da instrucciones para recibir notas
    cliente.sendMessage(
      numeroEmisor,
      `${nombreNotificacion}, si deseas saber notas debes de ahora ingresar solo tu rut, sin puntos ni gui??n, en caso de terminar en k reempl??celo con un 1, ej: el rut 12.345.678-k se escribe 123456781. Si eres extranjero, SE INCLUYE EL 100. SI NO LO HACE CORRECTAMENTE SU PETICION SERA ANULADA E IGNORADA (Puede que se responda con cualquier cosa absurda)`
    );
  } else if (!isNaN(cuerpoMensaje)&&validaRut(cuerpoMensaje)) {//envio de notas usando solo el rut
    envioNotas(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje);
  } else if (cuerpoMensaje.search(/boton/) >= 0) {//podria usarse aqui para un menu con la palabra ayuda
    mensajeEntrante.reply("quieres boton"); //responderal mensaje
    let boton=new Buttons('mensajeboton',[{body:'cuerpoboton'},{body:'cuerpoboton2'}],'titulo','footer');
    console.log(boton)
    mensajeEntrante.reply(boton)
    cliente.sendMessage(numeroEmisor,boton)//********falla opcion de envio, revisar */
    cliente.sendMessage(numeroEmisor,"mande botones")
  } else if (cuerpoMensaje.search(/lista/)>=0) {//envio de lista de itemes. parece no funcionar
    console.log('inicio de proceso de lista')
    let secciones =[{title:'secciontitulo',rows:[{title:'item1',description:'descripcion'},{title:'item2'}]}];
    let lista = new List('cuerpo de lista','btnText',secciones,'titulo','footer');
    cliente.sendMessage(numeroEmisor,lista);
    console.log('fin proceso de lista')
  } else if (cuerpoMensaje.normalize("NFD").replace(/[\u0300-\u036f]/g, "").search(/adios/) >= 0||cuerpoMensaje.search(/chao/) >= 0) {//despedida con mensaje final
    mensajeEntrante.reply(
      "Chao. Para mas informaci??n visita cuando quieras https://www.profedaniel.cf"
    );
  } else if (cuerpoMensaje.search(/email/)>=0){//instrucciones de cambio de email en la base de datos
    //console.log('inicio de envio de  INSTRUCCIONES DE  cambio de email');
    cliente.sendMessage(numeroEmisor,`${nombreNotificacion}, para cambiar tu email en el que recibes las notas debes escribir ahora tu rut sin puntos ni guion seguido de una coma y el nuevo email. SIN ESPACIOS o su solicitud ser?? rechazada. En caso que su rut termine en k reempl??celo por un 1. Si es extranjero no escriba el 100 \n ej: 123456781,nuevocorreo@gmail.com`)
  } else if(cuerpoMensaje.search(/@/)>=0){
    //se analiza si esta correcto el mensaje
    let rutconEmail = cuerpoMensaje.split(',')
    //regex del rut deprecado por ser innecesario para este proceso
    //let RUT = rutconEmail[0].replace(/[\.,-]/g, "");
    //console.log(RUT);
    var nuevoEmailalumno = rutconEmail[1].replace(" ","")
    //console.log(nuevoEmailalumno);
    if (validadorEmail.validate(nuevoEmailalumno)){
      //console.log(`${nuevoEmailalumno} es un email valido`);
      cambioEmail(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje);
    }
  } else if (cuerpoMensaje.search(/opciones/)>=0){//opciones del bot y sus acciones
    cliente.sendMessage(numeroEmisor,`Opciones: ${nombreNotificacion} escribe en palabras tu solicitud segun lo que quieras hacer\n`+
                                      '1.- escribe **opciones** para volver a ver este mensaje\n'+
                                      '2.- puedes **pedir notas** simplemente escribi??ndolo\n'+
                                      '3.- pideme **cambiar email** para cambiar tu correo para recibir resultados de las pruebas')
  } else if(cuerpoMensaje.search(/\/profesor/)>=0){
    cliente.sendMessage(numeroEmisor,`${nombreNotificacion}, para solicitar los datos de algun estudiante `+
                                     `debes usar el comando, un espacio y el rut del estudiante sin puntos ni gui??n. `+
                                     `En caso de terminar en k, reempl??celo por un 1 en esta forma exactamente por ejemplo: /datos 123456781 `+
                                     `\nSi es rut extranjero NO incluya e 100`)
  } else if(cuerpoMensaje.search(/\/datos/)>=0){
      datosEstudiante(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje);
  } else {/**contesta cleverbot */
    clever(cuerpoMensaje)
      .then(async (respuestacleverBot) => {
        await //console.log("respuesta cleverbot: " + respuestacleverBot);
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
appExpress.listen(puerto,()=>{console.log(`escuchando en http://localhost:${puerto}`)});
