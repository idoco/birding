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
    // console.log(JSON.stringify(birdsOverTime, null, 4))

    features = [];
    Object.keys(birdsOverTime).forEach(function (key) {
        const birdTimeline = birdsOverTime[key];
        const coordinates = birdTimeline.map(bird => [bird.location.longitude, bird.location.latitude, 0]);
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

        if (coordinates.length == 0 || coordinates.length == 1) return;

        features.push({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {
                "stroke": randomColor,
                "stroke-width": 3,
                "stroke-opacity": 1,
                "name": key,
                "hops": coordinates.length,
                "styleUrl": "#line-DB4436-5",
                "styleHash": "3f0b0940"
            }
        });
    });

    const geoJson = {
        "type": "FeatureCollection",
        "features": features
    }
}

// single step to geojson of it's birds locations
const singleStepToGeoJson = (birds) => {

    const points = birds.map(bird => ({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [
                bird.location.longitude,
                bird.location.latitude
            ]
        },
        properties: {
            battery_level: bird.battery_level,
            code: bird.code,
            id: bird.id
        }
    }));

    return {
        "type": "FeatureCollection",
        "features": points
    };
}

const distanceInMeters = (p1, p2) => {
    return geodist(
        { lat: p1.latitude, lon: p1.longitude },
        { lat: p2.latitude, lon: p2.longitude },
        { unit: 'meters' }
    );

}

main();
