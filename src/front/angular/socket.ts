import { Socket as s } from 'ngx-socket-io'

export class Socket extends s {
  constructor(url: string, token: string) {
    super({
      url: url,
      options: { query: { token } },
    });
  }
}
