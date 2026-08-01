import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type CatalogCategory = "cylinder" | "accessory";

@Entity("product_catalog")
export class ProductCatalog {
  @PrimaryGeneratedColumn("uuid")
  declare id: string;

  @Column({ type: "varchar", length: 255 })
  declare name: string;

  @Column({ type: "text", nullable: true })
  declare description: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  declare defaultPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  declare defaultWeight: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  declare defaultSize: string | null;

  @Column({ type: "enum", enum: ["cylinder", "accessory"], default: "cylinder" })
  declare category: CatalogCategory;

  @Column({ type: "varchar", length: 500, nullable: true })
  declare imageUrl: string | null;

  @Column({ type: "boolean", default: true })
  declare isActive: boolean;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}