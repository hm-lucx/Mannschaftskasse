import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Fine } from './fine.entity';

@Entity('fine_categories')
export class FineCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  default_amount: number;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Fine, (f) => f.fine_category)
  fines: Fine[];
}
