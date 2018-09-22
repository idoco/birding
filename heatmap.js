const createTimeline = require('./timeline').createTimeline;

const targetFolder = process.argv[2] || './data/tlv_9_12_2018';
const options = process.argv[3];

const main = async () => {

    let timeline = await createTimeline(targetFolder);
    
    // filter every x item from timeline to keep heatmap data small
    const trimFactor = Math.max(Math.floor(timeline.length / 300), 1);
    timeline = timeline.filter( (_, index) => index % trimFactor  === 0)

    const timestamps = timeline.map((step) => step.date);
    const locations = timeline.map(step =>
        step.birds.map((bird) =>
            [bird.location.latitude, bird.location.longitude, bird.battery_level / 100])
    )

    const heatmapTimeline = { timestamps, locations };
    console.log("const heatmapTimeline = " + JSON.stringify(heatmapTimeline, null, 4));
}

main();
