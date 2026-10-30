import { IDataAdapter } from './adapter';
import { SQLiteAdapter } from './sqliteAdapter';
import { OracleAdapter } from './oracleAdapter';

let adapterInstance: IDataAdapter | null = null;

export async function getDbAdapter(): Promise<IDataAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  const ordsBaseUrl = process.env.ORDS_BASE_URL?.trim();

  if (ordsBaseUrl) {
    console.log(`[Database] Initializing Oracle APEX / ORDS Adapter at: ${ordsBaseUrl}`);
    adapterInstance = new OracleAdapter(ordsBaseUrl);
  } else {
    console.log('[Database] Initializing Local SQLite Adapter with WAL mode');
    adapterInstance = new SQLiteAdapter();
  }

  await adapterInstance.init();
  return adapterInstance;
}
