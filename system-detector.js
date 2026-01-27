const { app } = require("electron");
const os = require("os");

function getSystemInfo() {
    const arch = process.arch; // 'arm64' = Silicon, 'x64' = Intel
    const isAppleSilicon = arch === 'arm64';

    const osVersion = require('os').release();
    const majorVersion = parseInt(osVersion.split('.')[0]);

    // MacOS Version Mapping (Darwin Kernel Version)

    const versionMap = {
        24: 'Sequoia', // MacOS 15
        23: 'Sonoma', // MacOS 14
        22: 'Ventura', // MacOS 13
        21: 'Monterey', // MacOS 12
        20: 'Tahoe', // MacOS 26
        // (Add more as needed.)
    };

    const osName = versionMap[majorVersion] || `macOS ${majorVersion}`;

    return {
        architecture: isAppleSilicon ? 'arm64' : 'x64',
        archLabel: isAppleSilicon ? 'Apple Silicon' : 'Intel',
        osVersion: osName,
        majorVersion: majorVersion,
        fullVersion: osVersion
    };
}

module.exports = { getSystemInfo };