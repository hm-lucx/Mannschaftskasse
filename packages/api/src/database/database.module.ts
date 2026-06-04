import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'mannschaftskasse'),
        password: config.get('DB_PASS', 'mannschaftskasse_dev'),
        database: config.get('DB_NAME', 'mannschaftskasse'),
        synchronize: true,
        logging: config.get('NODE_ENV') === 'development',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
