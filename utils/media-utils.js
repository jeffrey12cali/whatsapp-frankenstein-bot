const { Buffer } = require("buffer")
const fs = require("fs/promises")
const subProcess = require("child_process")

const mediaCommandsCore = async function(command, filename, return_prefix) {
    try {
        subProcess.execSync(command);
        return return_prefix + filename;
    }
    catch (err) {
        console.error(err);
    }
}

module.exports.isVerticalVideo = async function(filename, path) {
    try {
        const resolution = subProcess.execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${path}/${filename}`).toString();
        console.log(resolution);
        const [w,h] = resolution.split("x");
        return w > h ? false : true;
    }
    catch (err) {
        console.error(err);
        return undefined;
    }
}

module.exports.trim = async function (filename, path, start, end){
    let command = `ffmpeg -ss ${start} -to ${end} -i ${path + '/' + filename} -c copy ${path + "/" + "trim_" + filename}`;
    return mediaCommandsCore(command, filename, "trim_");
}

module.exports.extractAudio = async function(filename, path) {
    let command = `ffmpeg -i ${path}/${filename} -q:a 0 -map a ./audio-output/${filename.split(".")[0]}.mp3`;
    return mediaCommandsCore(command, filename.split(".")[0]+".mp3", "");
}

module.exports.mergeImgAudio = async function (vertical, img_filename, aud_filename, img_path, aud_path) {
    let command = `ffmpeg -loop 1 -i ${img_path}/${img_filename} -i ${aud_path}/${aud_filename} -c:v libx264 -vf ${vertical ? "scale=480:-2" : "scale=-2:480"} -tune stillimage -c:a mp3 -shortest ${img_path}/${img_filename.split(".")[0]}.mp4`;
    return mediaCommandsCore(command, img_filename.split(".")[0] + ".mp4", "");
}

module.exports.saveBase64 = async function(base64, filename, path) {
    //console.log(base64.slice(0, 20));
    //const base = base64.split(",")[1];
    const buff = Buffer.from(base64, 'base64');
    await fs.writeFile(path + "/" + filename, buff);
}

module.exports.getMediaFormat = function(type) {
    console.log(type);
    switch (type) {
        case "mp4":
            return "mp4";
        case "ogg":
            return "ogg";
        case "mpeg":
            return "mp3";
        case "audio":
            return "mp3";
        case "document":
            return "pdf";
        case "image":
            return "jpeg";
        case "jpeg":
            return "jpeg";
        default:
            throw new Error("El formato no se encuentra registrado.");
    }
}

module.exports.changeVideoSpeed = async function(filename, path, speed) {
    const videoRate = (1 / speed).toFixed(2);
    const atempoFilters = [];
    let remaining = speed;
    while (remaining > 2.0) { atempoFilters.push('atempo=2.0'); remaining /= 2.0; }
    while (remaining < 0.5) { atempoFilters.push('atempo=0.5'); remaining *= 2.0; }
    atempoFilters.push(`atempo=${remaining.toFixed(2)}`);
    const atempo = atempoFilters.join(',');
    let command = `ffmpeg -i ${path}/${filename} -filter_complex "[0:v]setpts=${videoRate}*PTS[v];[0:a]${atempo}[a]" -map "[v]" -map "[a]" ${path}/speed_${filename}`;
    return mediaCommandsCore(command, `speed_${filename}`, '');
}
