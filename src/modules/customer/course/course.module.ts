import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CourseController } from "./course.controller";
import { CourseService } from "./course.service";
import { CourseEntity } from "../../../entities/course.entity";
import { CategoryEntity } from "../../../entities/category.entity";
import { ReviewModule } from "../../review/review.module";
import { CacheModule } from "../../cache/cache.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEntity, CategoryEntity]),
    forwardRef(() => ReviewModule),
    CacheModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
