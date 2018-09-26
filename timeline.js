const fs = require('fs');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
const geodist = require('geodist');

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

// list of all bird rides (That are longer than x meters)
const collectBirdRides = (birdsLocations) => {

    const rides = [];

    Object.keys(birdsLocations).forEach(birdCode => {
        const currentBirdLocations = birdsLocations[birdCode];
        currentBirdLocations.forEach((birdStep, stepIndex) => {
            if (stepIndex == 0) return; // first step can't end a ride, skip it

            const lastBirdStep = currentBirdLocations[stepIndex - 1];
            const distance = distanceInMeters(lastBirdStep.location, birdStep.location);
            const batteryUsed = lastBirdStep.battery_level - birdStep.battery_level;
            const duration = birdStep.date - lastBirdStep.date;
            const batteryUsedPerHour = batteryUsed / (duration / 60 / 60 / 1000);

            // If the new bird location qualifies as a ride add it to the list
            if (distance > 100 && duration > (2 * 60 * 1000) && batteryUsed > 0 && batteryUsedPerHour > 1) {
                rides.push({
                    birdCode, distance, duration, batteryUsed,
                    formatedDuration: moment.duration(duration, "milliseconds").format("hh:mm:ss"),
                    startTime: new Date(lastBirdStep.date),
                    endTime: new Date(birdStep.date),
                    startLocation: lastBirdStep.location,
                    endLocation: birdStep.location,
                    battery_level: birdStep.battery_level,
                    shekels: 5 + (0.5 * Math.ceil(duration / 60000)),
                    usd: 1 + (0.2 * Math.ceil(duration / 60000))
                });
            }
        });
    });

    return rides;
}

const distanceInMeters = (p1, p2) => {
    return geodist(
        { lat: p1.latitude, lon: p1.longitude },
        { lat: p2.latitude, lon: p2.longitude },
        { unit: 'meters' }
    );
}

module.exports = {
    createTimeline,
    collectBirdLocations,
    collectBirdRides
};
