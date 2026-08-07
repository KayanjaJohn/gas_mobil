import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type CatalogCategory = "cylinder" | "accessory";

@Entity("product_catalog")
export class ProductCatalog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  defaultPrice!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  defaultWeight!: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  defaultSize!: string | null;

  @Column({ type: "enum", enum: ["cylinder", "accessory"], default: "cylinder" })
  category!: CatalogCategory;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}