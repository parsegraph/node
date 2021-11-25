import TreeLog from "./TreeLog";

export default class NoopTreeLog extends TreeLog {
  writeLog() {
    // Do nothing.
  }
}

