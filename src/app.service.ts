import { Injectable, Inject } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import config from './config';
import { Client } from 'pg';

@Injectable()
export class AppService {
  constructor(
    private configSer: ConfigService,
    @Inject('DB_CONNECTION') private dbClient: Client,
    @Inject('API_KEY') private apiKey: string,
    @Inject('MyAsync') private tasks: any[],
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {
    // console.log(this.configSer.get<string>('API_KEY'));
    // console.log(this.configSer.get<string>('DATA_BASE'));
    // console.log('Config: ', this.configService.api_key);
  }
  getValue() {
    return new Promise((resolve, reject) => {
      this.dbClient.query('SELECT * FROM hola', function (error, res) {
        if (error) {
          reject(error);
          return;
        }
        resolve(res.rows);
      });
    });
  }
  getHello(): string {
    return `Hello World! ${this.apiKey}`;
  }

  getTasks(): any {
    return this.tasks;
  }
}
