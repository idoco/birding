const createTimeline = require('./timeline').createTimeline;

const targetFolder = process.argv[2] || './data/tlv_9_12_2018';

const main = async () => {

    const timeline = await createTimeline(targetFolder);

    const timestamps = timeline.map((step) => step.date);

    const locations = timeline.map(step =>
        step.birds.map((bird) =>
            [bird.location.latitude, bird.location.longitude, bird.battery_level / 100])
    )

    const heatmapTimeline = { timestamps, locations };
    console.log("const heatmapTimeline = " + JSON.stringify(heatmapTimeline, null, 4));
}

main();
