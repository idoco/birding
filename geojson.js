
// birdsOverTime to geojson showing all birds rides during the day (timeline)
const timeLineGeoJson = (birdsOverTime) => {
    
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
