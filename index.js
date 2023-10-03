const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const youtubesearchapi = require("youtube-search-api");
const subProcess = require("child_process");
const { MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable',
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    if (msg.body === '!test') {
        msg.reply('Callate. Callate. Callate la hijueputa jeta');
    }
    else if (msg.body.startsWith('!ytaud ')) {
        let query = msg.body.substring(7);
        youtubesearchapi
            .GetListByKeyword(query, false, 5, [{type: "video"}])
            .then( res => {
                let id = res.items[0].id;
                subProcess.execSync(`yt-dlp --extract-audio --audio-format opus -o "./audio-output/%(id)s.opus" https://www.youtube.com/watch?v=${id}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        process.exit(1);
                    }
                });
                try {
                    (async () => {
                        const media = MessageMedia.fromFilePath(`./audio-output/${id}.opus`);
                        await client.sendMessage(msg.from, media);
                        subProcess.execSync(`rm audio-output/${id}.opus`);
                    })();
                }
                catch(err) {
                    msg.reply(err);
                }
            });

    }
});

client.initialize();
 
