import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from './farm.entity';

@Entity('producers')
export class Producer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  cpfCnpj!: string;

  @Column()
  name!: string;

  @OneToMany(() => Farm, (farm) => farm.producer, { cascade: true })
  farms!: Farm[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
