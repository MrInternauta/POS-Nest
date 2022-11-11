import { Injectable } from '@nestjs/common';

// import { ConfigService, ConfigType } from '@nestjs/config';
// import { config } from './config';
// import { Client } from 'pg';

@Injectable()
export class AppService {
  constructor() {
    // @Inject(config.KEY) private configService: ConfigType<typeof config>, // @Inject('MyAsync') private tasks: any[], // @Inject('API_KEY') private apiKey: string, // // @Inject('DB_CONNECTION') private dbClient: Client, // private configSer: ConfigService,
    // console.log(this.configSer.get<string>('API_KEY'));
    // console.log(this.configSer.get<string>('DATA_BASE'));
    // console.log('Config: ', this.configService.api_key);
  }
  getValue() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('Hello world');
      }, 3000);
      // this.dbClient.query('SELECT * FROM hola', function (error, res) {
      //   if (error) {
      //     reject(error);
      //     return;
      //   }
      //   resolve(res.rows);
      // });
    });
  }
  getHello(): string {
    return `Hello World! ${'API_KEY'}`;
  }

  getTasks(): any {
    return [];
  }
}
