const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
const geodist = require('geodist');

const createTimeline = require('./timeline').createTimeline;
const collectBirdLocations = require('./timeline').collectBirdLocations;

const targetFolder = process.argv[2] || './data/tlv_9_12_2018';

const main = async () => {

    const timeline = await createTimeline(targetFolder);
    const birdLocations = collectBirdLocations(timeline);
    const rides = collectBirdRides(birdLocations);

    const sortedRides = rides.sort((a, b) => a.duration - b.duration);
    const middle = Math.floor(sortedRides.length/2)
    const medianDuration = moment.duration(sortedRides[middle].duration, "milliseconds").format("hh:mm:ss")
    
    // console.log(JSON.stringify(sortedRides, null, 4))

    const numberOfRides = rides.length;
    const totals = getTotals(rides);
    const averages = getAverages(numberOfRides, totals);
    console.log('Stats for', targetFolder);
    console.log('number of birds spotted', Object.keys(birdLocations).length);
    console.log('number of rides', rides.length);
    console.log('revenue in NIS', totals.shekels);
    console.log('median ride duration', medianDuration);
    console.log('averages', JSON.stringify(averages, null, 4));

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
                    startTime: new Date(lastBirdStep.date).toString(),
                    endTime: new Date(birdStep.date).toString(),
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

const distanceInMeters = (p1, p2) => {
        return geodist(
            { lat: p1.latitude, lon: p1.longitude },
            { lat: p2.latitude, lon: p2.longitude },
            { unit: 'meters' }
        );

    }

    main();
