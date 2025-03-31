const { MediaSender } = require('./MediaSender');

class VideoSender extends MediaSender {

    help0 = "- !v | Envía un video de la videoteca.\n";
    help1 =
`_Comando_: *!v*
_Descripción_: Envía un video de la lista de archivos que se muestra más abajo.
_Sintaxis_: !v <nombre del video>
_Utilización_: El comando puede utilizarse también respondiendo un mensaje para responder a ese mensaje con el video seleccionado.
_Ejemplo_: !v acostumbrate

`;

}

class VideoSender_Help extends VideoSender {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1() + this.showTeque(obj));
        this.completed = true;
    }
}

module.exports = { VideoSender, VideoSender_Help };
