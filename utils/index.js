/**
 * Just a method to wait for x amount of milliseconds
 * @param {number} ms
 */
module.exports.waitFor = async (ms) => new Promise((resolve) => setTimeout((resolve), ms))
