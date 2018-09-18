const fs = require('fs');
const util = require('util');

const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const targetFolder =  process.argv[2] || './data/tlv_9_12_2018';

const main = async () => {

    const timeline = await createTimeline(targetFolder);

    const timestamps = timeline.map((step) => step.date);

    const locations = timeline.map(step => 
        step.birds.map((bird) => 
            [bird.location.latitude, bird.location.longitude, bird.battery_level / 100])
    )

    const heatmapTimeline = {timestamps, locations};
    // console.log("const heatmapTimeline = " + JSON.stringify(heatmapTimeline, null, 4));

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
                const lastBirdLocation = lastBirdStep.location;
                const traveledDistance = approxDistanceInMeters(lastBirdLocation, bird.location);
                const duration = bird.date - lastBirdStep.date;

                birdsOverTime[birdCode].push(bird);
                
                if (traveledDistance > 25) {
                    rides.push({
                        birdCode: birdCode,
                        startTime: lastBirdStep.date,
                        startLocation: lastBirdLocation,
                        endTime: bird.date,
                        endLocation: bird.location,
                        duration: duration,
                        formatedDuration: moment.duration(duration, "milliseconds").format("mm:ss:SS"),
                        shekels: 5 + (0.5 * Math.ceil(duration/60000)),
                        usd: 1 + (0.2 * Math.ceil(duration/60000))
                    });                
                }
            }
        });
    });

    rides = rides.sort((a,b) => a.duration - b.duration);    
    console.log(JSON.stringify(rides, null, 4))
    // console.log(rides.reduce( (total, ride) => total + ride.shekels , 0));
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

// read data folder and create full timeline
const createTimeline = async (dataFolder) => {

    let dataFiles = (await readdir(dataFolder)).sort().filter(filename => !filename.startsWith('.'));

    const timeline = await Promise.all(dataFiles.map(async fileName => {
        let fileContent = await readFile(dataFolder + '/' + fileName);
        return JSON.parse(fileContent);
    }));

    return timeline;
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

// Bad two points distance approximation, assuming the world is flat (It is not!)
const approxDistanceInMeters = (p1, p2) => {
    return Math.sqrt(
        Math.pow((p1.latitude - p2.latitude), 2) +
        Math.pow((p1.longitude - p2.longitude), 2)
    ) * 10000;

}

main();
