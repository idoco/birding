### Collection of scripts used to collect and analyze data about [bird](https://bird.co) scooter locations across Tel Aviv

- [x] Lambda function for sampling bird locations using the bird.co internal API
- [x] Heatmap visualization of bird locations during a given day
- [ ] Analyze bird usage and revenues per day
- [ ] Predict the chances of finding a bird at a given time and location

One day of TLV Birds location heatmap - [demo](https://idoco.github.io/birding/heatmap_demo/)
[![heatmap demo](examples/heatmap_example.png)](https://idoco.github.io/birding/heatmap_demo/)

Full timeline GeoJson - [link](examples/timeline_example.geojson)
[![timeline geojson](examples/timeline_example.png)](examples/timeline_example.geojson)

### Usefull commands

Copy data from s3 - `aws s3 cp s3://birds-locations/${date} ./data/${date} --recursive`

Generate heatmap data - `node process.js ./data/${date} > heatmap_demo/heatmap_data.js`
