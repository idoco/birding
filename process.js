const fs = require('fs');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const folder = './data';

const main = async () => {

    timeline = [];
    birdsOverTime = {}

    let files = await readdir(folder);
    files.sort();

    // read all step files into the locations timeline
    for (i = 0; i < files.length; i++) {
        if (files[i] == '.DS_Store') continue;
        let fileContent = await readFile(folder + '/' + files[i]);
        let locations = JSON.parse(fileContent);
        timeline.push(locations);
    }

    // collect locations for heatmap
    heatmapTimeline = timeline.map((step) => 
            step.birds.map((bird) => [bird.location.latitude, bird.location.longitude])
    )

    // console.log(JSON.stringify(heatmapTimeline, null, 4));

    // populate bird location over time map
    timeline.forEach(step => {

        step.birds.forEach(bird => {
            const birdCode = bird.code;
            bird.date = step.date;

            if (!birdsOverTime[birdCode]) {
                birdsOverTime[birdCode] = [bird];
            } else {

                let birdTimeline = birdsOverTime[birdCode];
                let lastBirdLocation = birdTimeline[birdTimeline.length - 1].location;
                let traveledDistance = approxDistanceInMeters(lastBirdLocation, bird.location);

                if (traveledDistance > 10) {
                    birdsOverTime[birdCode].push(bird);
                }
            }

        });
    });

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

    console.log(JSON.stringify(geoJson, null, 4));
    // console.log(JSON.stringify(timeline, null, 4));

}

const stepToGeoJson = (birds) => {
    const points = [];

    birds.forEach(bird => {
        points.push({
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
        })
    });

    return {
        "type": "FeatureCollection",
        "features": points
    };
}

const approxDistanceInMeters = (p1, p2) => {
    return Math.sqrt(
        Math.pow((p1.latitude - p2.latitude), 2) +
        Math.pow((p1.longitude - p2.longitude), 2)
    ) * 10000;

}

main();
