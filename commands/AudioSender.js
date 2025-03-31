const { MediaSender } = require('./MediaSender');

class AudioSender extends MediaSender {

    help0 = "- !a | Envía un audio de la audioteca.\n";
    help1 =
`_Comando_: *!a*
_Descripción_: Envía un audio de la lista de archivos que se muestra más abajo.
_Sintaxis_: !a <nombre del audio>
_Utilización_: El comando puede utilizarse también respondiendo un mensaje para responder a ese mensaje con el audio seleccionado.
_Ejemplo_: !a israel

`;

}

class AudioSender_Help extends AudioSender {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1() + this.showTeque(obj));
        this.completed = true;
    }
}

module.exports = { AudioSender, AudioSender_Help };
