const redis = require("redis");
const client = redis.createClient(); // Add redis URL/config if needed

client.connect().catch(console.error);

module.exports = client;
