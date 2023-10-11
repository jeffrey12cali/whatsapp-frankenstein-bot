const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const youtubesearchapi = require("youtube-search-api");
const subProcess = require("child_process");
const { MessageMedia } = require('whatsapp-web.js');
const Booru = require("booru");
const textToImage = require("text-to-image");

const client = new Client({
    authStrategy: new LocalAuth(),
    //puppeteer: {
    //    executablePath: '/usr/bin/google-chrome-stable',
    //}
});

const nsfw_boorus = [];
const sfw_boorus = [];

function randomHSLAbg(bgColor){
    return `hsla(${bgColor}, 70%,  80%, 0.8)`
}
function randomHSLAtxt(bgColor){
    return `hsla(${(bgColor + 180) % 360}, 70%,  35%, 0.8)`
}

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

const sendYtAudio = (url, id, msg) => {
    console.log(id);
    try {
        subProcess.execSync(`yt-dlp --extract-audio --audio-format mp3 -o "./audio-output/%(id)s.mp3" ${url}`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        });
        (async () => {
            try {
                const media = MessageMedia.fromFilePath(`./audio-output/${id}.mp3`);
                await msg.reply(media);
                setTimeout(() => {
                    try {
                        subProcess.execSync(`rm audio-output/${id}.mp3`);
                    }
                    catch (err) {
                        msg.reply(err.message);
                    }
                }, 100);
            }
            catch (err) {
                msg.reply(err.message);
            }
        })();
    }
    catch (err) {
        msg.reply(err.message);
    }
}

async function getJson(url) {
    return await (await fetch(url)).json();
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
        let isYoutubeUrlTrad = query.includes('youtube.com/watch?v=');
        let isYoutubeUrlShort = query.includes('youtu.be/');
        let isYoutubeShortUrl = query.includes('youtube.com/shorts/');
        if (isYoutubeUrlTrad || isYoutubeUrlShort || isYoutubeShortUrl) {
            let id = '';
            if (isYoutubeUrlTrad) {
                id = query.match(/=(.)*/gm).toString().substring(1);
            }
            else if (isYoutubeUrlShort) {
                id = query.match(/.be\/(.)*\?/gm).toString().substring(4).slice(0, -1);
            }
            else if (isYoutubeShortUrl) {
                id = query.match(/\/shorts\/(.)*\?/gm).toString().substring(8).slice(0, -1);
            }
            else {
                msg.reply("Este tío es tonto");
            }
            try {
                console.log(id);
                youtubesearchapi
                    .GetVideoDetails(id)
                    .then( res => {
                        if (!res.isLive) {
                            sendYtAudio(query, id, msg);
                        }
                        else {
                            msg.reply("Video is live.");
                        }
                    });
            }
            catch (err) {
                msg.reply(err.message);
            }
        }
        else if (query.match(/\S+\.[^()\d]+(?:\([^)]*\))*/) == null) {
            try {
                youtubesearchapi
                    .GetListByKeyword(query, false, 5, [{type: "video"}])
                    .then( res => {
                        if (!res.items[0].isLive && !isTime1LongerThanTime2(res.items[0].length.simpleText, "10:00")) {
                            let id = res.items[0].id;
                            sendYtAudio(`https://www.youtube.com/watch?v=${id}`, id, msg);
                        }
                        else {
                            msg.reply("Video too long. Try with another search query.");
                        }
                    });
            }
            catch (err) {
                msg.reply(err.message);
            }
        }
        else {
            msg.reply("Este tío es tonto");
        }
    }
    else if (msg.body === '!booru help') {
        msg.reply('!booru <nombre/alias del booru> <tag1> <tag2> <tag3> ... <tag n> | Busca 3 imágenes relacionadas con el texto de búsqueda en el booru proporcionado.\n\n!booru list | lista los nombres de los boorus y sus alias.');
    }
    else if (msg.body === '!booru list') {
        let textBoorus = "Lista de Boorus disponibles:\n";
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
    }
    else if (msg.body.startsWith('!booru ')) {
        let inputs = msg.body.split(" ");
        if (inputs.length < 3) {
            msg.reply("Comando inválido. Este tío es tonto");
        }
        else {
            let isBooru = false;
            let booruAlias = inputs[1];
            let tags = inputs.slice(2);
            try {
                Booru.search(booruAlias, tags, { limit: 3, random: true })
                    .then( async (posts) => {
                        try {
                            if (posts && posts.length > 0) {
                                msg.reply(`Enviando 3 resultados de ${tags.join(", ")} en ${booruAlias}.`);
                                for (let post of posts) {
                                    const media = await MessageMedia.fromUrl(post.fileUrl);
                                    await client.sendMessage(msg.from, media);
                                }
                            }
                            else {
                                msg.reply("No hay resultados");
                            }
                        }
                        catch (err) {
                            msg.reply(err.message);
                        }
                    })
                    .catch( (err) => {
                        msg.reply(err.message);
                    });
                }
            catch (err) {
                msg.reply(err.message);
            }
        }
    }
    else if (msg.body === '!chef help') {
        msg.reply("!chef (size <tamaño de fuente, por defecto es 140>){opcional} <texto a mostrar>");
    }
    else if (msg.body.startsWith('!chef ')) {
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
            const bgColor = ~~(360 * Math.random());
            const dataUri = textToImage.generateSync(text, {
                bgColor: randomHSLAbg(bgColor),
                fontFamily: 'Felt Tip Roman',
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
        }
        catch (err) {
            msg.reply(err.message);
        }
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
    else if (msg.body === '!callate') {
        const media = MessageMedia.fromFilePath(`./audio/callate.ogg`);
        if (msg.hasQuotedMsg) {
            let source_msg = await msg.getQuotedMessage();
            await source_msg.reply(media);
        }
        else {
            await msg.reply(media);
        }
    }
});

client.initialize();
 
