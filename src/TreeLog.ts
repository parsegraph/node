const format = (str: string, ...args: any[]) => {
  const appending:any[] = [];

  args.forEach((arg:any, number)=>{
    const re = new RegExp("{("+number+")}", "g");
    if (!str.match(re)) {
      appending.push(arg);
    } else {
      str = str.replace(re, arg);
    }
  });

  appending.forEach(val=>{
    str += " " + val;
  });
  return str;
};

export default class TreeLog {
  _buffer: string[];

  constructor() {
    this._buffer = [];
  }

  flush():void {
    const buf = this._buffer;
    if (!buf) {
      return;
    }
    this._buffer = null;
    buf.forEach((str) => this.writeLog(str));
  }

  writeLog(str: string) {
    if (this._buffer) {
      this._buffer.push(str);
      return;
    }
    console.log(str);
  }

  logEnter(msg?: string, ...args: any) {
    this.writeLog(`>>> ${format(msg, ...args)}`);
  }

  logEnterc(cat: string, msg?: string, ...args: any) {
    this.writeLog(`>>> (${cat}) ${format(msg, ...args)}`);
  }

  logLeave(msg?: string, ...args: any) {
    if (arguments.length === 0) {
      this.writeLog(`<<<`);
      return;
    }
    this.writeLog(`<<< ${format(msg, ...args)}`);
  }

  log(msg: string, ...args: any) {
    this.writeLog(format(msg, ...args));
  }

  logc(cat: string, msg: string, ...args: any) {
    this.writeLog(`(${cat}) ${format(msg, ...args)}`);
  }
}



