const AWS = require('aws-sdk');

const axios = require("axios");
const uuid = require("uuid/v1");
const randomstring = require("randomstring");

const baseUrl = "https://api.bird.co/";
const loginPath = "user/login";
const birdsPath = "bird/nearby";
const appVersion = '3.0.5'

const tlvLatLng = { latitude: 32.079554, longitude: 34.781133 }
const sfLatLng = { latitude: 37.762053, longitude: -122.449028 }

const tlvTimeZone = "Asia/Jerusalem";
const sfTimeZone = "America/Los_Angeles";

// lambda function to collect the current birds locations and store them in s3.
// To change target city replace getBirds target location and dateString timezone
exports.handler = async (event) => {

    const email = randomstring.generate(10) + '@test.com'
    const device = uuid();
    const token = await login(email, device);
    const data = await getBirds(device, token, tlvLatLng);

    data.date = Date.now();
    const dateString = new Date().toLocaleString("en-GB", { timeZone: tlvTimeZone }).split(',')[0].replace(/\//g, '_')

    writeToS3(dateString, data.date, data)

    const response = {
        statusCode: 200,
        body: "Storing birds locations for " + data.date
    };

    return response;
};

const login = async (email, device) => {
    const response = await axios({
        method: 'post',
        url: baseUrl + loginPath,
        headers: {
            'Device-id': device,
            'Platform': 'ios'
        },
        data: {
            email: email,
        }
    });

    return response.data.token;
};

const getBirds = async (device, token, location) => {
    const response = await axios({
        method: 'get',
        url: baseUrl + birdsPath,
        headers: {
            'Authorization': 'Bird ' + token,
            'Device-id': device,
            'App-Version': appVersion,
            'Location': JSON.stringify(location)
        },
        params: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10000
        },
    });

    return response.data;
}

const writeToS3 = async (folder, filename, data) => {
    var s3 = new AWS.S3();
    var params = {
        Bucket: 'birds-locations',
        Key: folder + '/' + filename,
        Body: JSON.stringify(data)
    }
    await s3.putObject(params, function (err, data) {
        console.log("writeToS3");
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data);           // successful response
    });
}
