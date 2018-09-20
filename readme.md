### Tracking and analyzing [bird](https://bird.co) scooter locations across Tel Aviv

- [x] Lambda function for sampling bird locations using the bird.co internal API.
- [x] Heatmap visualization of bird locations during a given day.
- [ ] Analyze bird usage and revenues per day.
- [ ] Predict the chances of finding a bird at a given time and location.

One day of TLV Birds location heatmap - [demo](https://idoco.github.io/birding/heatmap_demo/)
[![heatmap demo](examples/heatmap_example.png)](https://idoco.github.io/birding/heatmap_demo/)

Full timeline GeoJson - [link](examples/timeline_example.geojson)
[![timeline geojson](examples/timeline_example.png)](examples/timeline_example.geojson)

### Key concepts

- Data is collected from publicly available sources. The birds are tracked using the `bird/nearby` API, which is basically the same as refreshing the app and registering locations every minute.
- The collected data is somewhat noisy. Inconsistent GPS signals and maintenance operations might look like bird rides. The data is cleaned by using a few heuristics:
  - Minimal bird ride is at least 100 meters long.
  - No ride is shorter than 1 minute.
  - Rides consume at least 1% of battery power.

### Usefull commands

Copy data from s3 - `aws s3 cp s3://birds-locations/${date} ./data/${date} --recursive`

Generate heatmap data - `node process.js ./data/${date} > heatmap_demo/heatmap_data.js`
