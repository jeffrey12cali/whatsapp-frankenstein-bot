jest.mock('child_process', () => ({
    exec: jest.fn(),
    execFile: jest.fn(),
    execSync: jest.fn()
}));

jest.mock('fs', () => ({
    existsSync: jest.fn()
}));

jest.mock('whatsapp-web.js', () => ({
    MessageMedia: {
        fromFilePath: jest.fn(() => ({ mimetype: 'video/mp4', data: 'fake' }))
    }
}));

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');
const md5 = require('md5');
const clientMessages = require('../../config/messages');
const { YtDlp, helpers } = require('../YtDlp');

const TEST_ID = 'abc123xyz';
const DOCKER_COOKIES_PATH = path.resolve('/app/config/cookies.txt');
const LOCAL_COOKIES_PATH = path.resolve(__dirname, '../../config/cookies.txt');
const flushMicrotasks = () => new Promise(setImmediate);
const waitForTimers = () => new Promise((resolve) => setTimeout(resolve, 0));

const createMsg = (overrides = {}) => ({
    body: '!ytvid sample',
    reply: jest.fn().mockResolvedValue(),
    hasQuotedMsg: false,
    links: [],
    getQuotedMessage: jest.fn(),
    ...overrides
});

afterEach(() => {
    jest.restoreAllMocks();
    fs.existsSync.mockReset();
});

describe('searchFilteredVideoId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
    });

    test('resolves video id when yt-dlp returns a match', async () => {
        childProcess.execFile.mockImplementation((command, args, callback) => {
            callback(null, `${TEST_ID}\n`, '');
        });

        await expect(helpers.searchFilteredVideoId('query')).resolves.toBe(TEST_ID);
        expect(childProcess.execFile).toHaveBeenCalledWith(
            'yt-dlp',
            expect.arrayContaining(['--js-runtimes', 'node', `ytsearch1:query`]),
            expect.any(Function)
        );
    });

    test('prefers docker cookies path when available', async () => {
        fs.existsSync.mockImplementation((checkedPath) => checkedPath === DOCKER_COOKIES_PATH);
        childProcess.execFile.mockImplementation((command, args, callback) => {
            callback(null, `${TEST_ID}\n`, '');
        });

        await helpers.searchFilteredVideoId('query');

        expect(childProcess.execFile).toHaveBeenCalledWith(
            'yt-dlp',
            expect.arrayContaining(['--cookies', DOCKER_COOKIES_PATH]),
            expect.any(Function)
        );
    });

    test('falls back to local cookies path when docker path missing', async () => {
        fs.existsSync.mockImplementation((checkedPath) => checkedPath === LOCAL_COOKIES_PATH);
        childProcess.execFile.mockImplementation((command, args, callback) => {
            callback(null, `${TEST_ID}\n`, '');
        });

        await helpers.searchFilteredVideoId('query');

        expect(childProcess.execFile).toHaveBeenCalledWith(
            'yt-dlp',
            expect.arrayContaining(['--cookies', LOCAL_COOKIES_PATH]),
            expect.any(Function)
        );
    });

    test('returns null when yt-dlp reports filter mismatch', async () => {
        childProcess.execFile.mockImplementation((command, args, callback) => {
            const err = new Error('filter mismatch');
            callback(err, '', 'Video does not pass filter');
        });

        await expect(helpers.searchFilteredVideoId('query')).resolves.toBeNull();
    });

    test('rejects when yt-dlp fails unexpectedly', async () => {
        childProcess.execFile.mockImplementation((command, args, callback) => {
            callback(new Error('boom'), '', '');
        });

        await expect(helpers.searchFilteredVideoId('query')).rejects.toThrow('boom');
    });
});

describe('sendMedia', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
    });

    test('builds video command with filters and removes temp file', async () => {
        const msg = createMsg();
        childProcess.exec.mockImplementation((command, callback) => {
            expect(command).toContain('--js-runtimes node');
            expect(command).toContain('--match-filter "!is_live & duration < 600"');
            expect(command).toContain('-S "vcodec:h264,res:480,ext:mp4"');
            callback(null, '', '');
        });
        childProcess.execSync.mockImplementation(() => { });

        await helpers.sendMedia('https://youtube.com/watch?v=abc', TEST_ID, msg, 'video', { applyFilters: true, cleanupDelayMs: 0 });
        await flushMicrotasks();
        await waitForTimers();

        expect(MessageMedia.fromFilePath).toHaveBeenCalledWith(`./video-output/${TEST_ID}.mp4`);
        expect(childProcess.execSync).toHaveBeenCalledWith(`rm video-output/${TEST_ID}.mp4`);
    });

    test('builds audio command without filters by default', async () => {
        const msg = createMsg();
        childProcess.exec.mockImplementation((command, callback) => {
            expect(command).toContain('--js-runtimes node');
            expect(command).toContain('--extract-audio');
            expect(command).not.toContain('--match-filter');
            callback(null, '', '');
        });
        childProcess.execSync.mockImplementation(() => { });

        await helpers.sendMedia('https://example.com/audio', TEST_ID, msg, 'audio', { cleanupDelayMs: 0 });
        await flushMicrotasks();
        await waitForTimers();

        expect(MessageMedia.fromFilePath).toHaveBeenCalledWith(`./audio-output/${TEST_ID}.mp3`);
    });

    test('replies with long video message when filter fails', async () => {
        const msg = createMsg();
        childProcess.exec.mockImplementation((command, callback) => {
            const err = new Error('filter');
            callback(err, '', 'ERROR: does not pass filter');
        });

        await helpers.sendMedia('https://youtube.com/watch?v=abc', TEST_ID, msg, 'video', { applyFilters: true, cleanupDelayMs: 0 });
        await flushMicrotasks();
        await waitForTimers();

        expect(msg.reply).toHaveBeenCalledWith(clientMessages["ytdlp_long_video"]);
    });

    test('replies with generic error when yt-dlp fails unexpectedly', async () => {
        const msg = createMsg();
        childProcess.exec.mockImplementation((command, callback) => {
            callback(new Error('unexpected'), '', '');
        });

        await helpers.sendMedia('https://youtube.com/watch?v=abc', TEST_ID, msg, 'video', { applyFilters: true, cleanupDelayMs: 0 });
        await flushMicrotasks();
        await waitForTimers();

        expect(msg.reply).toHaveBeenCalledWith(clientMessages["ytdlp_error"]);
    });

    test('adds docker cookies flag when cookies file exists', async () => {
        fs.existsSync.mockImplementation((checkedPath) => checkedPath === DOCKER_COOKIES_PATH);
        const msg = createMsg();
        childProcess.exec.mockImplementation((command, callback) => {
            expect(command).toContain(`--cookies "${DOCKER_COOKIES_PATH}"`);
            callback(null, '', '');
        });
        childProcess.execSync.mockImplementation(() => { });

        await helpers.sendMedia('https://youtube.com/watch?v=abc', TEST_ID, msg, 'video', { applyFilters: true, cleanupDelayMs: 0 });
        await flushMicrotasks();
        await waitForTimers();
    });

    test('adds local cookies flag when docker path missing but local exists', async () => {
        fs.existsSync.mockImplementation((checkedPath) => checkedPath === LOCAL_COOKIES_PATH);
        const msg = createMsg();
        childProcess.exec.mockImplementation((command, callback) => {
            expect(command).toContain(`--cookies "${LOCAL_COOKIES_PATH}"`);
            callback(null, '', '');
        });
        childProcess.execSync.mockImplementation(() => { });

        await helpers.sendMedia('https://youtube.com/watch?v=abc', TEST_ID, msg, 'video', { applyFilters: true, cleanupDelayMs: 0 });
        await flushMicrotasks();
        await waitForTimers();
    });
});

describe('YtDlp.init', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
    });

    test('parses traditional youtube links and forwards to sendMedia', async () => {
        const sendSpy = jest.spyOn(helpers, 'sendMedia').mockResolvedValue();
        const yt = new YtDlp();
        const msg = createMsg({ body: '!ytvid https://www.youtube.com/watch?v=XYZ987' });

        await yt.init(msg, { mode: 'video' });

        expect(sendSpy).toHaveBeenCalledWith(
            'https://www.youtube.com/watch?v=XYZ987',
            'XYZ987',
            msg,
            'video',
            { applyFilters: true }
        );
    });

    test('falls back to keyword search and sends result when found', async () => {
        const sendSpy = jest.spyOn(helpers, 'sendMedia').mockResolvedValue();
        jest.spyOn(helpers, 'searchFilteredVideoId').mockResolvedValue('short123');
        const yt = new YtDlp();
        const msg = createMsg({ body: '!ytvid test keyword' });

        await yt.init(msg, { mode: 'audio' });

        expect(helpers.searchFilteredVideoId).toHaveBeenCalledWith('test keyword');
        expect(sendSpy).toHaveBeenCalledWith(
            'https://www.youtube.com/watch?v=short123',
            'short123',
            msg,
            'audio',
            { applyFilters: true }
        );
    });

    test('replies when keyword search has no results', async () => {
        jest.spyOn(helpers, 'sendMedia').mockResolvedValue();
        jest.spyOn(helpers, 'searchFilteredVideoId').mockResolvedValue(null);
        const yt = new YtDlp();
        const msg = createMsg({ body: '!ytvid some missing song' });

        await yt.init(msg, { mode: 'video' });

        expect(msg.reply).toHaveBeenCalledWith(clientMessages["ytdlp_long_video"]);
    });

    test('handles non-youtube links by hashing URL', async () => {
        const sendSpy = jest.spyOn(helpers, 'sendMedia').mockResolvedValue();
        const externalLink = 'https://files.example.com/clip.mp4';
        const msg = createMsg({
            body: `!ytvid ${externalLink}`,
            links: [{ link: externalLink }]
        });
        const yt = new YtDlp();

        await yt.init(msg, { mode: 'audio' });

        expect(sendSpy).toHaveBeenCalledWith(
            externalLink,
            md5(externalLink),
            msg,
            'audio'
        );
    });

    test('replies when no parameters are provided', async () => {
        const msg = createMsg({ body: '!ytvid ' });
        const yt = new YtDlp();

        await yt.init(msg, { mode: 'video' });

        expect(msg.reply).toHaveBeenCalledWith(clientMessages["ytdlp_no_params"]);
    });
});
