'use strict'
// environment variables specified by the user
process.env["MONGO_CONNECTION_STRING"] = `mongodb://172.17.0.1:27017/sharelatex`; // docstore.config.url
// the user should specify the express listener
const expressListener = require('./app.js') // docstore.express.file

const owServerlessExpress = require('./owServerlessExpress.js')

exports.main = function(params){ // docstore.handler.function
  return owServerlessExpress(expressListener, params)
}