
const createTimeline = require('./timeline').createTimeline;
const collectBirdLocations = require('./timeline').collectBirdLocations;

const targetFolder = process.argv[2] || './data/tlv_9_12_2018';
const targetBirdCode = process.argv[3];

const main = async () => {

    const timeline = await createTimeline(targetFolder);
    const birdLocations = collectBirdLocations(timeline);
    console.log(JSON.stringify( timelineGeoJson(birdLocations), null, 4 ))

}

// birdsOverTime to geojson showing all birds rides during the day (timeline)
const timelineGeoJson = (birdsLocations) => {
    
    features = [];
    Object.keys(birdsLocations).forEach( birdCode => {

        if (targetBirdCode && targetBirdCode != birdCode) return;

        const currentBirdLocations = birdsLocations[birdCode];
        const coordinates = currentBirdLocations.map(bird => [bird.location.longitude, bird.location.latitude, 0]);
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
                "name": birdCode,
                "hops": coordinates.length,
                "styleUrl": "#line-DB4436-5",
                "styleHash": "3f0b0940"
            }
        });
    });

    return {
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

main();
