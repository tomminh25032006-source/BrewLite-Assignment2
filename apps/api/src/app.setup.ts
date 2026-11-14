import { INestApplication, ValidationPipe } from '@nestjs/common';

// Cấu hình dùng chung cho main.ts và integration test
export function configureApp(app: INestApplication): INestApplication {
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  return app;
}
