import { HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { CourseReponseDto } from "./dto/course-response.dto";
import { CourseEntity } from "../../../entities/course.entity";
import { CategoryEntity } from "../../../entities/category.entity";
import { PageOptionsDto } from "../../../common/dto/page-options.dto";
import { CourseStatus } from "../../../common/enum/course";
import { queryPaginationTakeSkip } from "../../../common/utils";
import { CustomHttpException } from "../../../common/exception/custom-http.exception";
import { StatusCodesList } from "../../../common/constants/status-codes-list.constants";
import { ReviewService } from "../../review/review.service";
import { RedisClientType } from "redis";
import { CacheService } from "../../cache/cache.service";

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
    @Inject(forwardRef(() => ReviewService))
    private readonly reviewService: ReviewService,
    @InjectDataSource() private readonly datasource: DataSource,
    private cacheManager: CacheService,
  ) {}

  async getCoursesFromCache(pageOptionsDto: PageOptionsDto): Promise<[CourseEntity[], number]> {
    const cache = (await this.cacheManager.getList(
      "customer-course:" + JSON.stringify(pageOptionsDto),
    )) as string[];

    if (cache.length === 0) {
      return null;
    }
    const total = parseInt(cache.pop());

    return [cache.map((c) => JSON.parse(c)) as CourseEntity[], total];
  }

  async getCourses(pageOptionsDto: PageOptionsDto): Promise<[CourseEntity[], number]> {
    // const cache = await this.getCoursesFromCache(pageOptionsDto);

    // if (cache) {
    //   return cache;
    // }

    const qb = this.courseRepository
      .createQueryBuilder("course")
      .select([
        "course",
        "categories.id",
        "categories.name",
        "owner.id",
        "owner.username",
        "owner.email",
        "owner.avatar",
        "categories.id",
        "categories.name",
      ])
      .leftJoin("course.categories", "categories")
      .leftJoin("course.owner", "owner")
      .leftJoin("course.reviews", "review")
      .addSelect("AVG(review.rating)", "course_rating")
      .addSelect("COUNT(review.id)", "course_rating_count")
      .where("course.status = :status", { status: CourseStatus.Published });

    if (pageOptionsDto.category_id) {
      qb.andWhere("categories.id = :category_id", { category_id: pageOptionsDto.category_id });
    }

    qb.groupBy("course.id, categories.id, owner.id");
    const r = await queryPaginationTakeSkip({ query: qb, o: pageOptionsDto });

    // await this.cacheManager.setList(
    //   "customer-course:" + JSON.stringify(pageOptionsDto),
    //   r[0].map((x) => JSON.stringify(x)).concat(r[1].toString()),
    //   60 * 60 * 24 * 7,
    // );

    return r;
  }

  async getMyCourses(
    pageOptionsDto: PageOptionsDto,
    user_id: number,
  ): Promise<[CourseEntity[], number]> {
    const qb = this.courseRepository
      .createQueryBuilder("course")
      .select([
        "course",
        "categories.id",
        "categories.name",
        "owner.id",
        "owner.username",
        "owner.email",
        "owner.avatar",
      ])
      .leftJoin("course.categories", "categories")
      .leftJoin("course.owner", "owner")
      .leftJoin("course.students", "students")
      .where("course.status = :status", { status: CourseStatus.Published })
      .andWhere("students.id = :user_id", { user_id })
      .andWhere("course.published_at IS NOT NULL");

    return await queryPaginationTakeSkip({ query: qb, o: pageOptionsDto });
  }

  async getCourseById(id: number, user_id?: number): Promise<CourseReponseDto> {
    // select id, title from lessons
    const c = await this.courseRepository
      .createQueryBuilder("course")
      .select([
        "course",
        "categories.id",
        "categories.name",
        "owner.id",
        "owner.username",
        "owner.email",
        "owner.avatar",
        "main_category.id",
        "main_category.name",
      ])
      .leftJoin("course.categories", "categories")
      .leftJoin("course.main_category", "main_category")
      .leftJoin("course.owner", "owner")
      .leftJoin("course.reviews", "review")
      .addSelect("AVG(review.rating)", "course_rating")
      .where("course.status = :status", { status: CourseStatus.Published })
      .andWhere("course.id = :id", { id })
      .andWhere("course.published_at IS NOT NULL")
      .groupBy("course.id, categories.id, owner.id,main_category.id")
      .getOne();

    let count = 0;
    let is_reviewed = false;
    if (user_id) {
      count = await this.datasource.createEntityManager().count("course_student", {
        where: {
          student_id: user_id,
          course_id: id,
        },
      });
      is_reviewed = await this.reviewService.isReviewed(id, user_id);
    }

    if (!c) {
      throw new CustomHttpException({
        message: "Không tìm thấy khóa học",
        statusCode: HttpStatus.NOT_FOUND,
        code: StatusCodesList.NotFound,
      });
    }

    return {
      ...c,
      is_bought: count > 0,
      is_reviewed,
    };
  }

  async isEnrolled(course_id: number, user_id: number): Promise<boolean> {
    const count = await this.datasource.createEntityManager().count("course_student", {
      where: {
        student_id: user_id,
        course_id,
      },
    });

    return count > 0;
  }

  async getCoursesByInstructorId(
    pageOptionsDto: PageOptionsDto,
    instructor_id: number,
  ): Promise<[CourseEntity[], number]> {
    const qb = this.courseRepository
      .createQueryBuilder("course")
      .select(["course", "owner.id", "owner.username", "owner.email", "owner.avatar"])
      .leftJoin("course.owner", "owner")
      .where("course.status = :status", { status: CourseStatus.Published })
      .andWhere("owner.id = :instructor_id", { instructor_id });

    return await queryPaginationTakeSkip({ query: qb, o: pageOptionsDto });
  }

  async getById(id: number): Promise<CourseEntity> {
    return await this.courseRepository.findOne({ where: { id } });
  }
}
