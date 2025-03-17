const diskCleanJob = require("./cronjobs/diskClean.job");

const cronjobs = [diskCleanJob];

module.exports = cronjobs;
