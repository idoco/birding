const fs = require('fs');
const util = require('util');

const readdir = util.promisify(fs.readdir);

const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");

const createTimeline = require('./timeline').createTimeline;
const collectBirdLocations = require('./timeline').collectBirdLocations;
const collectBirdRides = require('./timeline').collectBirdRides;

const targetFolder = process.argv[2] || './data/tlv_14_2018';
const statsType = process.argv[3] || 'text'; // text, json, csv or histogram

const main = async () => {

    switch (statsType) {

        case 'text':
            const rideStats = await collectRidesStats(targetFolder);
            printStats(rideStats);
            break;

        case 'json':
            const rides = (await collectRidesStats(targetFolder)).rides;
            console.log(JSON.stringify(rides, null, 4));    
            break;

        case 'csv':
            // targetFolder expects '/' sufix
            const dataFolders = (await readdir(targetFolder)).sort().filter(filename => !filename.startsWith('.'));

            const multipleRideStats = [];
            for (const folder of dataFolders) {
                const rideStats = await collectRidesStats(targetFolder + folder)
                multipleRideStats.push(rideStats);
            }
            printCsv(multipleRideStats);
            break;

        case 'histogram':
            const histogram = await getHistogram(targetFolder);
            console.log(histogram);
            break;

    }

}

const collectRidesStats = async (folder) => {
    const timeline = await createTimeline(folder);
    const birdLocations = collectBirdLocations(timeline);
    const rides = collectBirdRides(birdLocations);

    const sortedRides = rides.sort((a, b) => a.duration - b.duration);
    const middle = Math.floor(sortedRides.length / 2)
    const medianDuration = moment.duration(sortedRides[middle].duration, "milliseconds").format("hh:mm:ss")

    const numberOfRides = rides.length;
    const totals = getTotals(rides);
    const averages = getAverages(numberOfRides, totals);

    const tag = folder.split('/').pop();

    return { tag, birdLocations, rides, medianDuration, totals, averages };
}

const getTotals = (rides) => rides.reduce((a, b) => ({
    distance: a.distance + b.distance,
    duration: a.duration + b.duration,
    batteryUsed: a.batteryUsed + b.batteryUsed,
    shekels: a.shekels + b.shekels,
}));

const getAverages = (numberOfRides, totals) => ({
    distance: Number((totals.distance / numberOfRides).toFixed(2)),
    duration: moment.duration(totals.duration / numberOfRides, "milliseconds").format("hh:mm:ss"),
    batteryUsed: Number((totals.batteryUsed / numberOfRides).toFixed(2)),
    shekels: Number((totals.shekels / numberOfRides).toFixed(2)),
    powerUsedPerKm: Number((1000 / (totals.distance / totals.batteryUsed)).toFixed(2))
});

const printStats = ({ folder, birdLocations, rides, medianDuration, totals, averages }) => {
    console.log('Stats for', folder);
    console.log('number of birds spotted', Object.keys(birdLocations).length);
    console.log('number of rides', rides.length);
    console.log('revenue in NIS', totals.shekels);
    console.log('median ride duration', medianDuration);
    console.log('averages', JSON.stringify(averages, null, 4));
};


const printCsv = (rideStats) => {
    console.log("date, birds_spotted, number_of_rides, totals_shekels, median_duration, avg_distance, avg_duration, avg_batteryUsed, avg_shekels, powerUsedPerKm");
    rideStats.forEach(line => {
        console.log(toCsvLine(line));
    })
}

const toCsvLine = ({ tag, birdLocations, rides, medianDuration, totals, averages }) => [
    tag, Object.keys(birdLocations).length, rides.length, totals.shekels, medianDuration,
    ...Object.values(averages)
].join(", ");

const getHistogram = async (targetFolder) => {
    const histogram = {};
    const dataFolders = (await readdir(targetFolder)).sort().filter(filename => !filename.startsWith('.'));

    for (const folder of dataFolders) {
        const timeline = await createTimeline(targetFolder + folder);
        const birdLocations = collectBirdLocations(timeline);
        const rides = collectBirdRides(birdLocations);
    
        rides.forEach(ride => {
            const rideHour = ride.startTime.getHours();
            histogram[rideHour] = histogram[rideHour] ? histogram[rideHour] + 1 : 1;
        });
    }

    return histogram;
}

main();