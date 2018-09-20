const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
const geodist = require('geodist');

const createTimeline = require('./timeline');

const targetFolder = process.argv[2] || './data/tlv_9_12_2018';

const main = async () => {

    const timeline = await createTimeline(targetFolder);

    let birdsOverTime = {} // a map between bird code and its locations during the day
    let rides = []; // list of all bird rides (That are longer than x meters)

    timeline.forEach(step => {
        step.birds.forEach(bird => {
            const birdCode = bird.code;
            bird.date = step.date;

            if (!birdsOverTime[birdCode]) {
                birdsOverTime[birdCode] = [bird];

            } else {
                const birdTimeline = birdsOverTime[birdCode];
                const lastBirdStep = birdTimeline[birdTimeline.length - 1];
                const distance = distanceInMeters(lastBirdStep.location, bird.location);
                const batteryUsed = lastBirdStep.battery_level - bird.battery_level;
                const duration = bird.date - lastBirdStep.date;

                birdsOverTime[birdCode].push(bird);

                if (distance > 100 && duration > (2 * 60 * 1000) && batteryUsed != 0) {
                    rides.push({
                        birdCode, distance, duration, batteryUsed,
                        startTime: new Date(lastBirdStep.date),
                        endTime: new Date(bird.date),
                        startLocation: lastBirdStep.location,
                        endLocation: bird.location,
                        formatedDuration: moment.duration(duration, "milliseconds").format("mm:ss:SS"),
                        shekels: 5 + (0.5 * Math.ceil(duration / 60000)),
                        usd: 1 + (0.2 * Math.ceil(duration / 60000))
                    });
                }
            }
        });
    });

    rides = rides.sort((a, b) => a.duration - b.duration);
    // console.log(JSON.stringify(rides, null, 4))
    console.log(`Number of rides ${rides.length}`)
    console.log('Total revenue in NIS ' + rides.reduce((total, ride) => total + ride.shekels, 0));
}

const distanceInMeters = (p1, p2) => {
    return geodist(
        { lat: p1.latitude, lon: p1.longitude },
        { lat: p2.latitude, lon: p2.longitude },
        { unit: 'meters' }
    );

}

main();
