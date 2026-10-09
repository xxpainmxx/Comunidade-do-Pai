import { QuickDB } from "quick.db";

// Inicializa o banco de dados SQLite
const db = new QuickDB();

// Ativar modo WAL no SQLite para máxima performance, estabilidade e evitar concorrência/bloqueio
try {
    const rawDb = (db.driver as any)?._database;
    if (rawDb && typeof rawDb.pragma === 'function') {
        rawDb.pragma('journal_mode = WAL');
        rawDb.pragma('synchronous = NORMAL');
    }
} catch (e) {
    console.warn('[DB] Não foi possível configurar WAL no SQLite:', e);
}

// Corrige condição de corrida no QuickDB SqliteDriver (UNIQUE constraint failed: json.ID)
const originalSetRowByKey = db.driver.setRowByKey.bind(db.driver);
db.driver.setRowByKey = async function (table: string, key: string, value: any, update: boolean) {
    try {
        return await originalSetRowByKey(table, key, value, update);
    } catch (err: any) {
        if (err?.message?.includes('UNIQUE constraint failed') || err?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
            const stringifiedJson = JSON.stringify(value);
            (this as any)._database
                .prepare(`INSERT INTO ${table} (ID, json) VALUES (?, ?) ON CONFLICT(ID) DO UPDATE SET json = excluded.json`)
                .run(key, stringifiedJson);
            return value;
        }
        throw err;
    }
};

export default db;

