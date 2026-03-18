import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Producer } from '../../producers/entities/producer.entity';
import { Crop } from '../../crops/entities/crop.entity';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalArea!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  arableArea!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  vegetationArea!: number;

  @ManyToOne(() => Producer, (producer) => producer.farms, {
    onDelete: 'CASCADE',
  })
  producer!: Producer;

  @Column()
  producerId!: number;

  @OneToMany(() => Crop, (crop) => crop.farm, { cascade: true })
  crops!: Crop[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
