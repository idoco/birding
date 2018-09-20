const fs = require('fs');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

// read data folder and create full timeline
const createTimeline = async (dataFolder) => {

    let dataFiles = (await readdir(dataFolder)).sort().filter(filename => !filename.startsWith('.'));

    const timeline = await Promise.all(dataFiles.map(async fileName => {
        let fileContent = await readFile(dataFolder + '/' + fileName);
        return JSON.parse(fileContent);
    }));

    return timeline;
}

module.exports = createTimeline;
