import TreeLog from './TreeLog';

export default class WebsocketTreeLog extends TreeLog {
  _ws: WebSocket;
  _connected:boolean;

  constructor(url:string) {
    super();
    this._connected = false;
    this._ws = new WebSocket(url);
    this._ws.onopen = () => {
      this._connected = true;
      this.flush();
    };
  }

  writeLog(str: string) {
    if (this._connected) {
      this._ws.send(str);
      return;
    }
    super.writeLog(str);
  }
}
