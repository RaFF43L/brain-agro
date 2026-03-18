import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from './farm.entity';

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

  @Column()
  farmId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
