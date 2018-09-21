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

// returns a map between bird code and its locations during the day
const collectBirdLocations = (timeline) => {
    let birdsLocations = {}

    timeline.forEach(step => {
        step.birds.forEach(birdStep => {
            birdStep.date = step.date;
            if (!birdsLocations[birdStep.code]) {
                birdsLocations[birdStep.code] = [birdStep];
            } else {
                birdsLocations[birdStep.code].push(birdStep);
            }
        })
    });

    return birdsLocations;
}

module.exports = {
    createTimeline,
    collectBirdLocations
};
