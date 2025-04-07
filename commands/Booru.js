const { MessageMedia } = require('whatsapp-web.js');
const Boorus = require("booru");
const { Base } = require('./Base');
const { getJson } = require('../utils/utils');
const client_messages = require('../config/messages');

class Booru extends Base {

    help0 = "- !booru | Busca y envía imágenes de distintos boorus.\n";
    help1 =
`_Comando_: *!booru*
_Descripción_: Busca y envía imágenes de distintos boorus.
_Sintaxis_: !booru <nombre/alias del booru (!booru list help)> <tag1> <tag2> <tag3> ... <tag n>
_Utilización_: Buscar el booru sobre el que se quiere realizar la búsqueda las imágenes (!booru list) tomar el nombre o alias de uno de los boorus y escribir los tags separados por espacios.
_Ejemplo1_: !booru sb yang_wen-li
_Ejemplo2_: !booru r34 short_hair tummy tomboy`;

    async init(msg, obj) {
        const {client} = obj;
        this.completed = false;
        let inputs = msg.body.split(" ");
        if (inputs.length < 3) {
            msg.reply(client_messages["booru_invalid_command"]);
        }
        else {
            let booruAlias = inputs[1];
            let tags = inputs.slice(2);
            try {
                const posts = await Boorus.search(booruAlias, tags, { limit: 3, random: true });
                    try {
                        if (posts && posts.length > 0) {
                            msg.reply(`${client_messages["booru_sending_results"]} ${tags.join(", ")} en ${booruAlias}.`);
                            for (let post of posts) {
                                const media = await MessageMedia.fromUrl(post.fileUrl);
                                await client.sendMessage(msg.from, media);
                                this.completed = true;
                            }
                        }
                        else {
                            msg.reply(client_messages["booru_no_results"]);
                            this.completed = true;
                        }
                    }
                    catch (err) {
                        msg.reply(err.message);
                    }
                }
            catch (err) {
                msg.reply(err.message);
            }
        }
    }
}

class Booru_List extends Base {
    help0 = "- !booru list | Proporciona un listado de los boorus disponibles.\n";
    help1 =
`_Comando_: *!booru list*
_Descripción_: Proporciona un listado de los boorus disponibles.
_Sintaxis_: !booru list
_Utilización_: Escribir el comando.
_Ejemplo_: !booru list`;

    async init(msg, obj) {
        this.completed = false;
        const {sfw_boorus, nsfw_boorus} = obj;
        let textBoorus = `${client_messages["booru_availability_list"]}\n`;
        if (sfw_boorus.length == 0 && nsfw_boorus.length == 0) {
            let booruJson = await getJson('https://raw.githubusercontent.com/AtoraSuunva/booru/master/src/sites.json');
            for (const booruUrl in booruJson) {
                if (booruJson[booruUrl].nsfw) {
                    nsfw_boorus.push(booruJson[booruUrl]);
                }
                else {
                    sfw_boorus.push(booruJson[booruUrl]);
                }
            }
        }
        textBoorus += "_SFW_\n";
        for (let booru of sfw_boorus) {
            textBoorus += `${booru.domain} -> `;
            for (let alias of booru.aliases) {
                textBoorus += `${alias} `;
            }
            textBoorus += "\n";
        }
        textBoorus += "\n";
        textBoorus += "_NSFW_\n";
        for (let booru of nsfw_boorus) {
            textBoorus += `${booru.domain} -> `;
            for (let alias of booru.aliases) {
                textBoorus += `${alias} `;
            }
            textBoorus += "\n";
        }
        msg.reply(textBoorus);
        this.completed = true;
    }
}

class Booru_Help extends Booru {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

class Booru_List_Help extends Booru_List {
    init(msg, obj) {
        this.completed = false;
        msg.reply(this.getHelp1());
        this.completed = true;
    }
}

module.exports = { Booru, Booru_List, Booru_Help, Booru_List_Help };
