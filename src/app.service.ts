import { Injectable, Inject } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import config from './config';

@Injectable()
export class AppService {
  constructor(
    private configSer: ConfigService,
    @Inject('API_KEY') private apiKey: string,
    @Inject('MyAsync') private tasks: any[],
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {
    console.log(this.configSer.get<string>('API_KEY'));
    console.log(this.configSer.get<string>('DATA_BASE'));

    console.log('Config: ', this.configService.api_key);
  }

  getHello(): string {
    return `Hello World! ${this.apiKey}`;
  }

  getTasks(): any {
    return this.tasks;
  }
}
