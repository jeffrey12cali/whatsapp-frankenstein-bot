const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const mariadb = require('mariadb');
require('dotenv').config();

// Local
const { User } = require('./models/User');
const commands = require('./commands');
const blacklist = require('./config/blacklist');
const client_messages = require('./config/messages');
const { generateHelpText, generateTeque, verifyBlacklist } = require('./utils/utils');

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

// Global constants
const pool = mariadb.createPool({
    host,
    user,
    password,
    database
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    }
});

const command_obj = {"Test" : new commands.Test()}

const user_model = new User(pool);

const context = new commands.Context(command_obj.Test, user_model);

const help_text = generateHelpText(commands);

const user_cache = {};

let audioteque, videoteque;

(async function () {
    audioteque = await generateTeque('./audio', audioteque);
    videoteque = await generateTeque('./video', videoteque);
})();


// Core
const nsfw_boorus = [];
const sfw_boorus = [];


function runCommand(name, cmd_class, msg, parm_obj) {
    if (!command_obj[name]) {
        command_obj[name] = new cmd_class();
    }
    //console.log("Setting strategy");
    context.setStrategy(command_obj[name]);
    //console.log("Starting Command");
    context.startCommand(msg, parm_obj);
    //console.log("Ending Command");
}

// client.on('qr', qr => {
//     qrcode.generate(qr, {small: true}, function (qrcode) {
//         const server = http.createServer((req, res) => {
//             res.writeHead(200, { "Content-type": "text/plain" });
//             res.end(qrcode);
//         });
//         server.listen(3000, () => {
//             console.log(client_messages["server_running"]);
//             console.log(client_messages["refresh_reminder"]);
//         });
//         setTimeout(() => {
//             server.close(() => console.log("Server on port 3000 closed successfully"))
//         }, 21000);
//     });
//
// });

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log(client_messages["client_ready"]);
});

client.on('message_revoke_everyone', async (msg, revoked_msg) => {
    try {
        let contact = await revoked_msg.getContact();
        /* if (revoked_msg.hasMedia) {
            console.log("Deleted type: " + revoked_msg.type);
            try {
                let media = await revoked_msg.downloadMedia();
                if (revoked_msg.type == 'sticker') {
                    revoked_msg.reply(media, contact.isMe ? revoked_msg.to : revoked_msg.from, {sendMediaAsSticker: true});
                }
                else if (revoked_msg.type == 'ptt') {
                    revoked_msg.reply(media, contact.isMe ? revoked_msg.to : revoked_msg.from, {sendAudioAsVoice: true});
                }
                else if (revoked_msg.type == 'document') {
                    revoked_msg.reply(media, contact.isMe ? revoked_msg.to : revoked_msg.from, {sendMediaAsDocument: true});
                }
                else {
                    if (contact.isMe) {
                        revoked_msg.reply(media, revoked_msg.to, {mentions: [revoked_msg.id.participant], caption: revoked_msg.body});
                    }
                    else {
                        revoked_msg.reply(media);
                    }
                }
            }
            catch (err) {
                console.log(err);
                revoked_msg.reply(revoked_msg.body);
            }
        } */
        if (contact.isMe) {
            revoked_msg.reply(revoked_msg.body, revoked_msg.to, {mentions: [revoked_msg.id.participant]});
        }
        else {
            revoked_msg.reply(`${client_messages["revoked_msg_1"]}, @${contact.id.user}: "_${revoked_msg.body}_"`, revoked_msg.from, {mentions: [contact.id._serialized]});
        }
        revoked_msg.reply(`${client_messages["revoked_msg_2"]}. @` + (contact.isMe ? revoked_msg.id.participant.slice(0,-5) : contact.id.user), contact.isMe ? revoked_msg.to : revoked_msg.from, {mentions: [contact.isMe ? revoked_msg.id.participant : contact.id._serialized]});
    }
    catch (err) {
        console.log(err);
        msg.reply(client_messages["revoked_msg_3"]);
    }
});

client.on('message', async (msg) => {
    // Clear queue
    /*const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - msg.timestamp > 5) {
        return;
    }*/
    if (msg.body.startsWith('!')) {
        //console.log("Message found");
        if (await verifyBlacklist(msg, blacklist)) {
            if (msg.body === '!test') {
                runCommand("Test", commands.Test, msg, {});
            }
            else if (msg.body === '!test help') {
                runCommand("Test_Help", commands.Test_Help, msg, {});
            }
            else if (msg.body === '!help') {
                runCommand("Help", commands.Help, msg, {help_text});
            }
            else if (msg.body === '!ytaud help') {
                runCommand("YtAud_Help", commands.YtAud_Help, msg);
            }
            else if (msg.body.startsWith('!ytaud')) {
                runCommand("YtAud", commands.YtAud, msg, { mode: 'audio' });
            }
            else if (msg.body === '!a help') {
                runCommand("AudioSender_Help", commands.AudioSender_Help, msg, audioteque);
            }
            else if (msg.body.startsWith('!a ')) {
                runCommand("AudioSender", commands.AudioSender, msg, audioteque);
            }
            else if (msg.body === '!v help') {
                runCommand("VideoSender_Help", commands.VideoSender_Help, msg, videoteque);
            }
            else if (msg.body.startsWith('!v ')) {
                runCommand("VideoSender", commands.VideoSender, msg, videoteque);
            }
            else if (msg.body === '!booru help') {
                runCommand("Booru_Help", commands.Booru_Help, msg);
            }
            else if (msg.body === '!booru list help') {
                runCommand("Booru_List_Help", commands.Booru_List_Help, msg);
            }
            else if (msg.body === '!booru list') {
                runCommand("Booru_List", commands.Booru_List, msg, {sfw_boorus, nsfw_boorus});
            }
            else if (msg.body.startsWith('!booru ')) {
                runCommand("Booru", commands.Booru, msg, {client});
            }
            else if (msg.body === '!chef help') {
                runCommand("Chef_Help", commands.Chef_Help, msg);
            }
            else if (msg.body.startsWith('!chef ')) {
                runCommand("Chef", commands.Chef, msg);
            }
            else if (msg.body === '!sticker help') {
                runCommand("Sticker_Help", commands.Sticker_Help, msg);
            }
            else if (msg.body === '!sticker') {
                runCommand("Sticker", commands.Sticker, msg);
            }
            else if (msg.body === '!photo help') {
                runCommand("Photo_Help", commands.Photo_Help, msg);
            }
            else if (msg.body === '!photo') {
                runCommand("Photo", commands.Photo, msg);
            }
            else if (msg.body === '!paladmin help') {
                runCommand("PalAdmin_Help", commands.PalAdmin_Help, msg);
            }
            else if (msg.body.startsWith('!paladmin ')) {
                runCommand("PalAdmin", commands.PalAdmin, msg);
            }
            else if (msg.body.startsWith('!ytvid help')) {
                runCommand("YtVid_Help", commands.YtVid_Help, msg);
            }
            else if (msg.body.startsWith('!ytvid')) {
                runCommand("YtVid", commands.YtVid, msg, { mode: 'video' });
            }
            else if (msg.body.startsWith('!trim help')) {
                runCommand("Trim_Help", commands.Trim_Help, msg);
            }
            else if (msg.body.startsWith('!trim ')) {
                runCommand("Trim", commands.Trim, msg);
            }
            else if (msg.body == '!aud help') {
                runCommand("Aud_Help", commands.Aud_Help, msg);
            }
            else if (msg.body == '!aud') {
                runCommand("Aud", commands.Aud, msg);
            }
            else if (msg.body == '!imgvid help') {
                runCommand("ImgVid_Help", commands.ImgVid_Help, msg);
            }
            else if (msg.body == '!imgvid') {
                runCommand("ImgVid", commands.ImgVid, msg);
            }
            else if (msg.body == '!chat help') {
                runCommand("Chat_Help", commands.Chat_Help, msg);
            }
            else if (msg.body.startsWith('!chat ')) {
                runCommand("Chat", commands.Chat, msg, {user_model});
            }
            else if (msg.body == '!everyone help') {
                runCommand("Everyone_Help", commands.Everyone_Help, msg, {client});
            }
            else if (msg.body.startsWith('!everyone')) {
                runCommand("Everyone", commands.Everyone , msg, {client});
            }
            else if (msg.body.startsWith("!")) {
                runCommand("Blank", commands.Blank, msg);
            }
        }
        //console.log("Execution end");
    }
});

client.initialize();
 
