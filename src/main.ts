import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //Remove not declared fields
      forbidNonWhitelisted: true, //Send a error with not declared fields
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  ); //Activate pipe validator

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('My example')
    .setDescription('The store API description')
    .setVersion('1.0')
    //.addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors();
  // {
  //   origin: ['localhost'],
  // }
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
