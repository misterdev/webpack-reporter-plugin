class Formatter {
  black(text) {
    return `\u001B[30m${text}\u001B[0m`;
  }
  red(text) {
    return `\u001B[31m${text}\u001B[0m`;
  }
  green(text) {
    return `\u001B[32m${text}\u001B[0m`;
  }
  yellow(text) {
    return `\u001B[33m${text}\u001B[0m`;
  }
  blue(text) {
    return `\u001B[34m${text}\u001B[0m`;
  }
  purple(text) {
    return `\u001B[35m${text}\u001B[0m`;
  }
  lightblue(text) {
    return `\u001B[36m${text}\u001B[0m`;
  }
  white(text) {
    return `\u001B[37m${text}\u001B[0m`;
  }
  bold(text) {
    return `\u001B[1m${text}\u001B[0m`;
  }
}

module.exports = Formatter;
