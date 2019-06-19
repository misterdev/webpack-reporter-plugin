module.exports = {
  black: (text) => `\u001B[30m${text}\u001B[0m`,
  red: (text) => `\u001B[31m${text}\u001B[0m`,
  green: (text) => `\u001B[32m${text}\u001B[0m`,
  yellow: (text) => `\u001B[33m${text}\u001B[0m`,
  blue: (text) => `\u001B[34m${text}\u001B[0m`,
  purple: (text) => `\u001B[35m${text}\u001B[0m`,
  lightblue: (text) => `\u001B[36m${text}\u001B[0m`,
  white: (text) => `\u001B[37m${text}\u001B[0m`,
  bold: (text) => `\u001B[1m${text}\u001B[0m`,
};
