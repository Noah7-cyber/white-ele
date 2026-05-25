import { AppDataSource } from "../../core/config/database";
import { Item } from "../../shared/entities/Item";
import { Repository, EntityManager } from "typeorm";
import { logger } from "../../shared";

interface CreateItemData {
  description: string;
  quantity: number;
  rate: number;
  tax?: number;
  schoolId: number;
  invoiceId: number;
}

class ItemService {
  private get itemRepository(): Repository<Item> {
    return AppDataSource.getRepository(Item);
  }

  /**
   * Creates a new item in the database
   * @param data - Item data including description, quantity, rate, schoolId, and invoiceId
   * @param options - Optional transaction manager for use during invoice creation
   * @returns The created Item entity
   */
  async createItem(data: CreateItemData, options?: { manager?: EntityManager }): Promise<Item> {
    try {
      // Calculate total from line amount + line tax
      const lineAmount = data.quantity * data.rate;
      const lineTaxAmount = lineAmount * ((data.tax || 0) / 100);
      const total = lineAmount + lineTaxAmount;

      const itemData: Partial<Item> = {
        description: data.description,
        quantity: data.quantity,
        rate: data.rate,
        total: total,
        tax: data.tax || 0,
        schoolId: data.schoolId,
        invoiceId: data.invoiceId,
      };

      let item: Item;

      // Use transaction manager if provided (for invoice creation)
      if (options?.manager) {
        item = options.manager.create(Item, itemData);
        item = await options.manager.save(item);
      } else {
        // Fallback to repository
        item = this.itemRepository.create(itemData);
        item = await this.itemRepository.save(item);
      }

      logger.info(`Item created: ${item.id} for invoice ${data.invoiceId}`);
      return item;
    } catch (error: any) {
      logger.error("Error creating item:", error);
      throw new Error(error.message || "Failed to create item");
    }
  }

  /**
   * Creates multiple items in a batch
   * @param itemsData - Array of item data
   * @param options - Optional transaction manager for use during invoice creation
   * @returns Array of created Item entities
   */
  async createItems(itemsData: CreateItemData[], options?: { manager?: EntityManager }): Promise<Item[]> {
    try {
      const items: Item[] = [];

      for (const data of itemsData) {
        const item = await this.createItem(data, options);
        items.push(item);
      }

      logger.info(`Created ${items.length} items`);
      return items;
    } catch (error: any) {
      logger.error("Error creating items:", error);
      throw new Error(error.message || "Failed to create items");
    }
  }
}

export const itemService = new ItemService();

