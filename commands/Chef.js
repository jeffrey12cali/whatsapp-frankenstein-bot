const { Base } = require('./Base');
const textToImage = require("text-to-image");
const { MessageMedia } = require('whatsapp-web.js');
const client_messages = require('../config/messages');

function randomHSLAbg(bgColor){
    return `hsla(${bgColor}, 70%,  80%, 0.8)`
}
function randomHSLAtxt(bgColor){
    return `hsla(${(bgColor + 180) % 360}, 70%,  35%, 0.8)`
}

class Chef extends Base {

    help0 = "- !chef | Generador de imagechefs.\n";
    help1 =
`_Comando_: *!chef*
_Descripción_: Generador de imagechefs.
_Sintaxis_: !chef (size <tamaño de fuente, 140 por defecto>) <texto a mostrar>
_Utilización_: Seleccionar el tamaño de fuente si se desea cambiar y escribir el texto.
_Ejemplo1_: !chef botsito te vigila
_Ejemplo2_: !chef size 90 el gobierno te vigila, mantén puertas y ventanas cerradas durante las horas de la madrugada`;

    async init(msg) {
        this.completed = false;
        try {
            let input = msg.body.split(" ");
            let font_size = 140;
            let text = '';
            if (input[1] == 'size' && !isNaN(input[2])) {
                font_size = Number(input[2]);
                text = input.slice(3).join(" ");
            }
            else {
                text = input.slice(1).join(" ");
            }
            if (font_size < 0 || font_size > 1000 || text.length > 1000) {
                msg.reply(client_messages["chef_invalid_length"]);
                this.completed = true;
            }
            else {
                const bgColor = ~~(360 * Math.random());
                const dataUri = textToImage.generateSync(text, {
                    bgColor: randomHSLAbg(bgColor),
                    fontFamily: 'Felt Tip Roman',
                    fontWeight: 'bold',
                    fontSize: font_size,
                    lineHeight: font_size+20,
                    textColor:randomHSLAtxt(bgColor) ,
                    customHeight: 683,
                    maxWidth: 683,
                    textAlign: 'center',
                    verticalAlign: 'center',
                    margin: 0
                });
                const media = new MessageMedia('image/png', dataUri.substring(22));
                msg.reply(media);
                this.completed = true;
            }
        }
        catch (err) {
            msg.reply(err.message);
        }
    }
}

class Chef_Help extends Chef {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Chef, Chef_Help };
