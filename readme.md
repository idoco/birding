### Collection of scripts used to collect and analyze data about bird scooter locations across Tel Aviv

- [x] Lambda functions to sample bird locations using bird.co internal API
- [x] Heatmap visualization of bird locations during a a given day
- [ ] Analyze bird revenues per day

One day of TLV Birds location heatmap - [demo](https://idoco.github.io/birding/heatmap_demo/)
[![heatmap demo](examples/heatmap_example.png)](https://idoco.github.io/birding/heatmap_demo/)

Full timeline GeoJson - [link](examples/timeline_example.geojson)
[![timeline geojson](examples/timeline_example.png)](examples/timeline_example.geojson)

### Usefull commands

Copy data from s3 - `aws s3 cp s3://birds-locations/${date} ./data/${date} --recursive`

Generate heatmap data - `node process.js ./data/${date} > heatmap_demo/heatmap_data.js`
