const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const youtubesearchapi = require("youtube-search-api");
const subProcess = require("child_process");
const { MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    //puppeteer: {
    //    executablePath: '/usr/bin/google-chrome-stable',
    //}
});

const isTime1LongerThanTime2 = (time1, time2) => {
    const time1_list = time1.split(":");
    const time2_list = time2.split(":");

    if (time1_list.length > time2_list.length) {
        return true;
    }
    else if (time1_list.length < time2_list.length) {
        return false;
    }
    else if (time1_list.length = time2_list.length) {
        for (let i = 0; i < time1_list.length; i++) {
            if (time1_list[i] = time2_list[i]) {
                continue;
            }
            if (time1_list[i] > time2_list[i]) {
                return true;
            }
            else {
                return false
            }
        }
    }
}

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
                if (!isTime1LongerThanTime2(res.items[0].length.simpleText, "30:00")) {
                    let id = res.items[0].id;
                    subProcess.execSync(`yt-dlp --extract-audio --audio-format mp3 -o "./audio-output/%(id)s.mp3" https://www.youtube.com/watch?v=${id}`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            process.exit(1);
                        }
                    });
                    try {
                        (async () => {
                            const media = MessageMedia.fromFilePath(`./audio-output/${id}.mp3`);
                            await msg.reply(media);
                            setTimeout(() => {
                                subProcess.execSync(`rm audio-output/${id}.mp3`);
                            }, 100);
                        })();
                    }
                    catch(err) {
                        msg.reply(err);
                    }
                }
                else {
                    msg.reply("Video too long. Try with another search query.");
                }
            });
    }
    else if (msg.body.startsWith('!ytvid ')) {
        msg.reply("Monday left me broken");
        /*let query = msg.body.substring(7);
        youtubesearchapi
            .GetListByKeyword(query, false, 5, [{type: "video"}])
            .then( res => {
                if (!isTime1LongerThanTime2(res.items[0].length.simpleText, "30:00")) {
                    let id = res.items[0].id;
                    subProcess.execSync(`yt-dlp -f "bestvideo[height<=480][ext=mp4]+worstaudio" --recode-video flv -o "./video-output/%(id)s.flv" https://www.youtube.com/watch?v=${id}`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            process.exit(1);
                        }
                    });
                    subProcess.execSync(`ffmpeg -y -i ./video-output/${id}.mp4 -c:a libopus -preset ultrafast ./video-output/${id}_opus.mp4`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            process.exit(1);
                        }
                    });
                    try {
                        (async () => {
                            const media = MessageMedia.fromFilePath(`./video-output/${id}.flv`);
                            await client.sendMessage(msg.from, media);
                            setTimeout(() => {
                                //subProcess.execSync(`rm video-output/${id}.flv`);
                                //subProcess.execSync(`rm video-output/${id}_opus.mp4`);
                            }, 500);
                        })();
                    }
                    catch(err) {
                        msg.reply(err);
                    }
                }
                else {
                    msg.reply("Video too long. Try with another search query.");
                }
            });*/
    }
});

client.initialize();
 
