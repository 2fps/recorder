// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    reporters: [
        "default",
        ["jest-html-reporters", {
            publicPath: "./test-report",
            filename: "report.html",
            expand: true
        }]
    ]
    // testResultsProcessor: "./node_modules/jest-html-reporter"
};