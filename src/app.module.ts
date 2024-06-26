import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import winstonConfig from "src/config/winston";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedModule } from "./shared/services/shared.module";
import { ApiConfigService } from "./shared/services/api-config.service";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { ExcuteModule } from "./modules/execute/execute.module";
import { HealthModule } from "./modules/health/health.module";
import { UploadModule } from "./modules/upload/upload.module";
import { JwtModule } from "@nestjs/jwt";
import { MailerModule } from "./modules/mailer/mailer.module";
import { CategoryModule } from "./modules/category/category.module";
import { ScheduleModule } from "@nestjs/schedule";
import typeorm from "./config/typeorm";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { PromModule } from "./modules/prometheus/prometheus.module";
import { OtherModule } from "./modules/other/other.module";
import { AdminModule } from "./modules/admin/admin.module";
import { InstructorModule } from "./modules/instructor/instructor.module";
import { CustomerModule } from "./modules/customer/customer.module";
import { ReviewModule } from "./modules/review/review.module";
import { TransactionModule } from "./modules/transaction/transaction.module";
import { SocketModule } from "./modules/socket/socket.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { TagModule } from "./modules/tag/tag.module";
import { PostModule } from "./modules/post/post.module";

@Module({
  imports: [
    // I18nModule.forRoot({
    //   fallbackLanguage: "en",
    //   loaderOptions: {
    //     path: path.join(__dirname, "/i18n/"),
    //     watch: true,
    //   },
    //   resolvers: [
    //     { use: QueryResolver, options: ["lang"] },
    //     AcceptLanguageResolver,
    //   ],
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ? process.env.NODE_ENV : "local"}`],
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: async (configService: ApiConfigService) => configService.getPostgresConfig(),
      inject: [ApiConfigService],
    }),

    WinstonModule.forRoot(winstonConfig),
    ScheduleModule.forRoot(),
    ReviewModule,
    PromModule,
    ExcuteModule,
    AuthModule,
    UserModule,
    HealthModule,
    UploadModule,
    JwtModule,
    MailerModule,
    CategoryModule,
    CustomerModule,
    OtherModule,
    AdminModule,
    InstructorModule,
    TransactionModule,
    SocketModule,
    TagModule,
    PostModule,
    NotificationModule,
  ],
  // providers: [
  //   {
  //     provide: APP_FILTER,
  //     useClass: I18nExceptionFilterPipe,
  //   },
  // ],
})
export class AppModule {}
