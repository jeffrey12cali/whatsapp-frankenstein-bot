const childProcess = require('child_process');
const { helpers } = require('../YtDlp');

const hasYtDlp = (() => {
    try {
        childProcess.execFileSync('yt-dlp', ['--version'], { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
})();

const describeIntegration = hasYtDlp ? describe : describe.skip;
const SHORT_VIDEO_ID = 'D5HM4_T3hEE';
const LONG_LIVE_ID = '5qap5aO4i9A';

describeIntegration('YtDlp helpers integration (yt-dlp required)', () => {
    beforeAll(() => {
        jest.setTimeout(30000);
    });

    test('searchFilteredVideoId finds known short video', async () => {
        const result = await helpers.searchFilteredVideoId(SHORT_VIDEO_ID);
        expect(result).toBe(SHORT_VIDEO_ID);
    });

    test('searchFilteredVideoId ignores live/long videos via filters', async () => {
        const result = await helpers.searchFilteredVideoId(LONG_LIVE_ID);
        expect(result).toBeNull();
    });
});
