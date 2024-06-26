import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../common/abstract.entity";
import { LessonComponentType } from "../common/enum/lesson-component-type";
import { ContentCode } from "./lesson.entity";

@Entity("sample")
export class SampleEntity {
  @PrimaryColumn("text")
  id: string;

  @Column({ enum: LessonComponentType })
  type: LessonComponentType;

  @Column({ type: "jsonb" })
  content: ContentCode;
}
