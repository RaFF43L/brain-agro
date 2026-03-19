import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('crops')
export class Crop {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  season!: string;

  @Column()
  culture!: string;

  @ManyToOne(() => Farm, (farm) => farm.crops, { onDelete: 'CASCADE' })
  farm!: Farm;

  @Column({ nullable: true })
  farmId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
