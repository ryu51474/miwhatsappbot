const urlApiNotas =
    "https://script.google.com/macros/s/AKfycbyYYD23WAZ2_XBfRBgbeX4R5XqCwbfaPvrYkKQ38Dh7J3oPGKKQqv-3l8m8XxR_OaEKoQ/exec?sdata=";
const urlApiNuevoEmail =
    "https://script.google.com/macros/s/AKfycbyYYD23WAZ2_XBfRBgbeX4R5XqCwbfaPvrYkKQ38Dh7J3oPGKKQqv-3l8m8XxR_OaEKoQ/exec?sdata=";
const urlApiDatosEstudiante =
    "https://script.google.com/macros/s/AKfycbyYYD23WAZ2_XBfRBgbeX4R5XqCwbfaPvrYkKQ38Dh7J3oPGKKQqv-3l8m8XxR_OaEKoQ/exec?sdata=datosEstudiante,";

const {MessageMedia} = require('whatsapp-web.js');
const fetch = require('isomorphic-fetch');
const fs = require('fs');
var ahora=new Date();

function cambioEmail(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje){
    //console.log('inicia sistema de cambio de email llamado');
    let respuestaACambioStandard = `${nombreNotificacion}, cambio tu email a ${cuerpoMensaje.split(',')[1]} ahora mismo, dame unos segundos para verificar tus datos`;
    cliente.sendMessage(numeroEmisor,respuestaACambioStandard);
    //proceso de validacion de rut deprecado pues al cambiar email no necesita validar si es un rut valido o no
    //if(cuerpoMensaje.split(',')[0].substring(0,3)=='100') cuerpoMensaje = cuerpoMensaje.split('100')[1]
    fetch(urlApiNuevoEmail+cuerpoMensaje)
      .then((respuestaApiEmail)=>{
        return respuestaApiEmail;
      })
      .then((direccionObtenidaEmail)=>{
        fetch(direccionObtenidaEmail.url)
          .then((respuestarDireccionEmail)=>{
            return respuestarDireccionEmail.text();
          })
          .then((respuestaTextodeDireccionEmail)=>{
            //recibo el string
            console.log(respuestaTextodeDireccionEmail)
            cliente.sendMessage(numeroEmisor,respuestaTextodeDireccionEmail);
          })
          .catch((errorRespuestaDireccionEmail)=>{
            console.log(errorRespuestaDireccionEmail);
          })
      })
      .catch((errorDireccionObtenidaEmail=>{
        console.log(errorDireccionObtenidaEmail)
      }))
}

function envioNotas(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje){
  //si escribe un numero se toma como un rut y se analiza si se puede sacar las notas
  var RUT = cuerpoMensaje.replace(/[\.,-]/g, ""); //no tiene sentido el    .replace(/k/gi,'1')
  if (RUT.substring(0,3)=='100') RUT=RUT.split('100')[1]
  cliente.sendMessage(
    numeroEmisor,
    "Espere un momento mientras reviso sus datos."
  );
  fetch(urlApiNotas + RUT)
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
}
function datosEstudiante(cliente,nombreNotificacion,numeroEmisor,cuerpoMensaje){
  cliente.sendMessage(numeroEmisor,`${nombreNotificacion}, dame unos segundos para revisar los datos`);
  cuerpoMensaje = cuerpoMensaje.split(' ')[1]  
  var RUT = cuerpoMensaje.replace(/[\.,-]/g, "");
  fetch(urlApiDatosEstudiante+RUT)
    .then((direccionRespuestaApiDatosEstudiante)=>{
        return direccionRespuestaApiDatosEstudiante;
    })
    .then((direccionRespuestaApiDatosEstudiante)=>{
      fetch(direccionRespuestaApiDatosEstudiante.url)
        .then((respuestaDireccionApiDatosEstudiante)=>{
          return respuestaDireccionApiDatosEstudiante.text();
        })
        .then((respuestaDireccionApiDatosEstudiante)=>{
          //recibo el string
          if(
            respuestaDireccionApiDatosEstudiante!=="Estudiante no existe, reintente"
          ){
            //console.log(respuestaDireccionApiDatosEstudiante);
            setTimeout(async ()=>{
              await cliente.sendMessage(numeroEmisor,respuestaDireccionApiDatosEstudiante);
            },5000)
          } else {
            cliente.sendMessage(
              numeroEmisor,
              "Estudiante no existe, verifique los datos y reintente. Si el problema persiste escriba a dcornejo@liceotecnicotalcahuano.cl indicando su rut, nombre y curso"
            );
          }
        })
        .catch((errorRespuestaDireccionApiDatosEstudiante)=>{
          console.log(errorRespuestaDireccionApiDatosEstudiante)
        });
    })
    .catch((errorUrlApiDatosEstudiante)=>{
      console.log(`Error en urlApiDatosEstudiante por: ${errorUrlApiDatosEstudiante}`);
    })
}


module.exports={
    cambioEmail,
    envioNotas,
    datosEstudiante
}