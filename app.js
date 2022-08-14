
const { Client, LocalAuth } = require('whatsapp-web.js');
const codigoqr = require('qrcode-terminal');
const  fs  = require('fs');
const ARCHIVO_DE_SESIONES='./sesion.json';

//nueva forma de autnticarse???
cliente = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

//aqui se genera el codigo qr
cliente.on('qr',qr => {
    console.log('no habia sesion iniciada');
    codigoqr.generate(qr,{small:true});
    console.log('se inicia sesion');
});
cliente.on('ready',()=>{
    console.log('cliente inicializado');
})
/* cliente.on('authenticated', (session)=>{
    sessionData=session;
    fs.writeFile(ARCHIVO_DE_SESIONES,session, (errorAutenticacion)=>{
        if(errorAutenticacion){
            console.log(errorAutenticacion)
        };
    });
}); */
cliente.on('auth_failure', (e) => {
     console.log(e)
    // connectionLost()
});

cliente.on('message',mensajeEntrante => {
    console.log(mensajeEntrante.body);
    console.log(mensajeEntrante.from);
    console.log(mensajeEntrante)
    if(mensajeEntrante.body.toLowerCase()==='hola'){
        cliente.sendMessage(mensajeEntrante.from,'respuesta automatica');
    }
})


//para recibir y escuchar los mensajes entrantes


cliente.initialize();


