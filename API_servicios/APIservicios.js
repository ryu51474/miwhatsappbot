const urlApiNotas =
    "https://script.google.com/macros/s/AKfycbyYYD23WAZ2_XBfRBgbeX4R5XqCwbfaPvrYkKQ38Dh7J3oPGKKQqv-3l8m8XxR_OaEKoQ/exec?sdata=";
    const urlApiNuevoEmail =
    "https://script.google.com/macros/s/AKfycbyYYD23WAZ2_XBfRBgbeX4R5XqCwbfaPvrYkKQ38Dh7J3oPGKKQqv-3l8m8XxR_OaEKoQ/exec?sdata=";
function cambioEmail(RUT,cliente,nombreNotificacion,cuerpoMensaje){
    console.log('inicia sistema de cambio de email');
}

function envioNotas(RUT,cliente,nombreNotificacion,cuerpoMensaje){
  //si escribe un numero se toma como un rut y se analiza si se puede sacar las notas
  var RUT = cuerpoMensaje.replace(/[\.,-]/g, ""); //no tiene sentido el    .replace(/k/gi,'1')
  cliente.sendMessage(
    numeroEmisor,
    "Espere un momento mientras reviso sus datos."
  );
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
}


module.exports[
    cambioEmail,
    envioNotas
]