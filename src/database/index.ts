// Import Dependencies
import { openDB } from "idb";
import DBSchemas, { FLWarriorDBTables } from "@database/schema";
// Import Types
import type { IDBPDatabase } from "idb";
import type { FLWarriorDBSchema } from "@database/schema";
// Export Init Function
class DatabaseService {
    readonly DB_NAME = "FLWarriorDB";

    readonly DB_VERSION = 2;

    #database: IDBPDatabase<FLWarriorDBSchema>;

    async getDb() {
        if (!this.#database) {
            // Database not created
            this.#database = await openDB<FLWarriorDBSchema>(
                this.DB_NAME,
                this.DB_VERSION,
                {
                    upgrade(db, oldVersion, newVersion, transaction) {
                        for (const tableName in DBSchemas) {
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    DBSchemas,
                                    tableName
                                )
                            ) {
                                // Create table
                                if (!oldVersion) {
                                    db.createObjectStore(
                                        tableName as FLWarriorDBTables,
                                        {
                                            keyPath:
                                                DBSchemas[tableName].keyPath,
                                        }
                                    );
                                }
                                if (newVersion === 2) {
                                    // Create Indexes
                                    for (const index of DBSchemas[tableName]
                                        .indexes) {
                                        transaction
                                            .objectStore(
                                                tableName as FLWarriorDBTables
                                            )
                                            .createIndex(index.key, index.key, {
                                                unique: index.unique,
                                            });
                                    }
                                }
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
