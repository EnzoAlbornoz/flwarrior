// Import Dependencies
import { openDB } from "idb";
import DBSchemas, { FLWarriorDBTables } from "@database/schema";
// Import Types
import type { IDBPDatabase } from "idb";
import type { FLWarriorDBSchema } from "@database/schema";
// Export Init Function
class DatabaseService {
    readonly DB_NAME = "FLWarriorDB";

    readonly DB_VERSION = 1;

    #database: IDBPDatabase<FLWarriorDBSchema>;

    async getDb() {
        if (!this.#database) {
            // Database not created
            this.#database = await openDB<FLWarriorDBSchema>(
                this.DB_NAME,
                this.DB_VERSION,
                {
                    upgrade(db) {
                        for (const tableName in DBSchemas) {
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    DBSchemas,
                                    tableName
                                )
                            ) {
                                // Create table
                                db.createObjectStore(
                                    tableName as FLWarriorDBTables,
                                    {
                                        keyPath: DBSchemas[tableName].keyPath,
                                    }
                                );
                            }
                        }
                    },
                }
            );
        }
        return this.#database;
    }
}

const singleton = new DatabaseService();
export default singleton;

export async function useDatabase(): Promise<IDBPDatabase<FLWarriorDBSchema>> {
    return singleton.getDb();
}
