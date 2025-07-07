
const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => `${timestamp}  [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.resolve(__dirname, "server.log"),
      maxsize: 1024 * 1024,   // 1 MB
      maxFiles: 3
    })
  ]
});

module.exports = logger;
