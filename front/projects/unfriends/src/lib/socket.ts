// import { Socket as s } from 'ngx-socket-io'

export class Socket {
  once(arg0: string, arg1: (res?: any) => void): any {
    throw new Error('Method not implemented.');
  }
  disconnect(): any {
    throw new Error('Method not implemented.');
  }
  emit(event: string, data?: any): any {
    throw new Error('Method not implemented.');
  }
  fromEvent<T>(event: string): any {
    throw new Error('Method not implemented.');
  }
  constructor(url: string, token: string) {
    // super({
    //   url: url,
    //   options: { query: { token } },
    // });
  }
}
