const fs = require('node:fs/promises');
const { MessageMedia } = require('whatsapp-web.js');
const {phone} = require('phone');


module.exports.doLog = async function (msg) {
    const line = await module.exports.getLogLine(msg);
    module.exports.writeLog(line);
}

module.exports.writeLog = async function (line) {
    try {
        await fs.writeFile('./logs/log.txt', line, { flag: 'a' });
    } catch (err) {
        console.log(err);
    }
}

module.exports.getLogLine = async function (msg) {
    try {
        const contact = await module.exports.getAuthorContact(msg);
        try {
            const number = contact.number;
            const name = contact.pushname;
            const timestamp = msg.timestamp;
            const body = msg.body;
            const date = new Date(timestamp * 1000);
            return `|${date.toString()}| ${name} (${number}): ${body}\n`;
        }
        catch (err) {
            console.log(err);
        }
    }
    catch (err) {
        console.log(err);
    }
}

module.exports.verifyBlacklist = async function (msg, blacklist, user_cache) {
    let grantAccess = true;
    try {
        const contact = await module.exports.getAuthorContact(msg);
        try {
            const number = contact.number;
            if (blacklist.includes(number.toString())) {
                grantAccess = false;
                if (number == "17207741598") {
                }
                else {
                    msg.reply("Botsito te baneó ;)");
                }
            }
        }
        catch (err) {
            console.log(err)
            msg.reply("Can't get contact number");
        }
    }
    catch (err) {
        console.log(err);
        msg.reply("Can't get author contact");
    }
    return grantAccess;
}

module.exports.getAuthorContact = async function (msg) {
    let contact;
    try {
        contact = await msg.getContact();
    }
    catch (err) {
        console.log(err);
    }
    return contact;
}

module.exports.getJson = async function (url) {
    return await (await fetch(url)).json();
}

module.exports.validatePhoneNumber = function (num) {
    return phone('+' + num);
}

module.exports.generateHelpText = function (commandsObj) {
    let help_text =
`Botsito es un proyecto de recocha que consiste en un bot de WhatsApp que utiliza la librería de código abierto whatsapp-web.js.\n
El caracter de acción del bot es '!' acompañado del comando a ejecutar.
*Cada comando tiene su opción de 'help' que explica su uso. Por ejemplo: !test help.*\n
Los siguientes son los comandos disponibles:\n`;
    for (const [key, value] of Object.entries(commandsObj)) {
        if (key !== "Context" && key.split('_').pop() !== "Help") {
            command = new value();
            help_text += command.getHelp0(); 
        }
    }
    return help_text;
}

module.exports.sendMedia = async function (msg, path) {
    const media = MessageMedia.fromFilePath(path);
    if (msg.hasQuotedMsg) {
        let source_msg = await msg.getQuotedMessage();
        await source_msg.reply(media);
    }
    else {
        await msg.reply(media);
    }
}

module.exports.generateTeque = async function (base_path, variable) {
    try {
        let files = await fs.readdir(base_path);
        return {
            base_path,
            files
        };
    }
    catch (err) {
        console.error(err);
    }
}
