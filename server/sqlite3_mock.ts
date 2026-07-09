import fs from "fs";
import path from "path";

class MockDatabase {
  private dbPath: string;

  constructor(dbPath: string, mode?: any, callback?: any) {
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (typeof mode === "function") {
      setTimeout(() => mode(null), 1);
    } else if (typeof callback === "function") {
      setTimeout(() => callback(null), 1);
    }
  }

  private loadState(): any {
    const jsonPath = this.dbPath.endsWith(".db") ? this.dbPath + "_json" : this.dbPath;
    try {
      if (fs.existsSync(jsonPath)) {
        const content = fs.readFileSync(jsonPath, "utf8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to load mock sqlite state:", e);
    }
    return {
      tables: {
        local_components: []
      },
      schema: {
        local_components: [
          { name: "id", type: "TEXT", isPrimary: true },
          { name: "project_id", type: "TEXT", isPrimary: false },
          { name: "name", type: "TEXT", isPrimary: false },
          { name: "category", type: "TEXT", isPrimary: false },
          { name: "code_snippet", type: "TEXT", isPrimary: false },
          { name: "structure_json", type: "TEXT", isPrimary: false },
          { name: "created_at", type: "DATETIME", isPrimary: false }
        ]
      }
    };
  }

  private saveState(state: any) {
    const jsonPath = this.dbPath.endsWith(".db") ? this.dbPath + "_json" : this.dbPath;
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(state, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to save mock sqlite state:", e);
    }
  }

  serialize(callback: () => void) {
    callback();
  }

  close(callback?: (err: any) => void) {
    if (callback) setTimeout(() => callback(null), 1);
  }

  run(sql: string, paramsOrCb?: any, cb?: any) {
    let params: any[] = [];
    let callback: any = null;

    if (typeof paramsOrCb === "function") {
      callback = paramsOrCb;
    } else {
      params = Array.isArray(paramsOrCb) ? paramsOrCb : (paramsOrCb ? [paramsOrCb] : []);
      callback = cb;
    }

    try {
      const state = this.loadState();
      const sqlLower = sql.toLowerCase().trim();

      let changes = 0;

      if (sqlLower.startsWith("create table")) {
        const match = sql.match(/create table\s+(?:if not exists\s+)?([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1];
          if (!state.tables[tableName]) {
            state.tables[tableName] = [];
            const cols: any[] = [];
            const colsMatch = sql.match(/\((.+)\)/s);
            if (colsMatch) {
              const colLines = colsMatch[1].split(",");
              colLines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                  const colName = parts[0].replace(/['"`]/g, "");
                  const colType = parts[1].toUpperCase();
                  const isPrimary = line.toUpperCase().includes("PRIMARY KEY");
                  cols.push({ name: colName, type: colType, isPrimary });
                }
              });
            }
            state.schema[tableName] = cols;
            this.saveState(state);
          }
        }
      } else if (sqlLower.startsWith("insert into")) {
        const match = sql.match(/insert into\s+([a-zA-Z0-9_]+)\s*(?:\(([^)]+)\))?/i);
        if (match) {
          const tableName = match[1];
          const keysText = match[2];
          let keys: string[] = [];
          if (keysText) {
            keys = keysText.split(",").map(k => k.trim().replace(/['"`]/g, ""));
          }

          if (!state.tables[tableName]) {
            state.tables[tableName] = [];
          }

          const newRow: any = {};
          keys.forEach((key, idx) => {
            newRow[key] = params[idx];
          });
          newRow.created_at = newRow.created_at || new Date().toISOString();

          const pkCol = (state.schema[tableName] || []).find((c: any) => c.isPrimary);
          if (pkCol && newRow[pkCol.name] !== undefined) {
            const pkName = pkCol.name;
            const existingIdx = state.tables[tableName].findIndex((r: any) => String(r[pkName]) === String(newRow[pkName]));
            if (existingIdx > -1) {
              state.tables[tableName][existingIdx] = { ...state.tables[tableName][existingIdx], ...newRow };
            } else {
              state.tables[tableName].push(newRow);
            }
          } else {
            state.tables[tableName].push(newRow);
          }
          changes = 1;
          this.saveState(state);
        }
      } else if (sqlLower.startsWith("delete from")) {
        const match = sql.match(/delete from\s+([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1];
          if (state.tables[tableName]) {
            const originalCount = state.tables[tableName].length;
            if (sqlLower.includes("where")) {
              const wherePart = sql.substring(sqlLower.indexOf("where") + 5).trim();
              const placeholders = (wherePart.match(/\?/g) || []).length;
              if (placeholders === 2 && params.length >= 2) {
                const idVal = params[0];
                const projIdVal = params[1];
                state.tables[tableName] = state.tables[tableName].filter((r: any) => !(String(r.id) === String(idVal) && String(r.project_id) === String(projIdVal)));
              } else if (placeholders === 1 && params.length >= 1) {
                const fieldMatch = wherePart.match(/([a-zA-Z0-9_]+)\s*=/);
                if (fieldMatch) {
                  const fieldName = fieldMatch[1];
                  const val = params[0];
                  state.tables[tableName] = state.tables[tableName].filter((r: any) => String(r[fieldName]) !== String(val));
                }
              }
            } else {
              state.tables[tableName] = [];
            }
            changes = originalCount - state.tables[tableName].length;
            this.saveState(state);
          }
        }
      } else if (sqlLower.startsWith("update")) {
        const match = sql.match(/update\s+([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1];
          if (state.tables[tableName]) {
            const whereIdx = sqlLower.indexOf("where");
            let setPart = "";
            let wherePart = "";
            if (whereIdx > -1) {
              setPart = sql.substring(sqlLower.indexOf("set") + 3, whereIdx).trim();
              wherePart = sql.substring(whereIdx + 5).trim();
            } else {
              setPart = sql.substring(sqlLower.indexOf("set") + 3).trim();
            }

            const setFields = setPart.split(",").map(p => {
              const fMatch = p.match(/([a-zA-Z0-9_]+)\s*=/);
              return fMatch ? fMatch[1].trim() : "";
            }).filter(Boolean);

            const whereFieldMatch = wherePart.match(/([a-zA-Z0-9_]+)\s*=/);
            const whereField = whereFieldMatch ? whereFieldMatch[1].trim() : "";

            const setValues = params.slice(0, setFields.length);
            const whereValue = params[setFields.length];

            let count = 0;
            state.tables[tableName] = state.tables[tableName].map((r: any) => {
              if (String(r[whereField]) === String(whereValue)) {
                const updated = { ...r };
                setFields.forEach((f, idx) => {
                  updated[f] = setValues[idx];
                });
                count++;
                return updated;
              }
              return r;
            });

            changes = count;
            this.saveState(state);
          }
        }
      }

      if (callback) {
        setTimeout(() => callback.call({ changes }, null), 1);
      }
    } catch (e: any) {
      if (callback) {
        setTimeout(() => callback(e), 1);
      }
    }
  }

  all(sql: string, paramsOrCb?: any, cb?: any) {
    let params: any[] = [];
    let callback: any = null;

    if (typeof paramsOrCb === "function") {
      callback = paramsOrCb;
    } else {
      params = Array.isArray(paramsOrCb) ? paramsOrCb : (paramsOrCb ? [paramsOrCb] : []);
      callback = cb;
    }

    try {
      const state = this.loadState();
      const sqlLower = sql.toLowerCase().trim();

      if (sqlLower.includes("sqlite_master")) {
        const list = Object.keys(state.tables)
          .filter(name => !name.startsWith("sqlite_") && !name.startsWith("local_"))
          .map(name => ({ name }));
        if (callback) {
          setTimeout(() => callback(null, list), 1);
        }
        return;
      }

      if (sqlLower.startsWith("pragma table_info")) {
        const match = sql.match(/pragma table_info\((.+?)\)/i);
        if (match) {
          const tableName = match[1].trim().replace(/['"`]/g, "");
          const schema = state.schema[tableName] || [];
          const list = schema.map((c: any, i: number) => ({
            cid: i,
            name: c.name,
            type: c.type,
            notnull: 0,
            dflt_value: null,
            pk: c.isPrimary ? 1 : 0
          }));
          if (callback) {
            setTimeout(() => callback(null, list), 1);
          }
          return;
        }
      }

      const match = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const tableName = match[1];
        let rows = state.tables[tableName] || [];

        if (sqlLower.includes("where")) {
          const wherePart = sql.substring(sqlLower.indexOf("where") + 5).trim();
          const placeholders = (wherePart.match(/\?/g) || []).length;
          if (placeholders === 1 && params.length >= 1) {
            const fieldMatch = wherePart.match(/([a-zA-Z0-9_]+)\s*=/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const val = params[0];
              rows = rows.filter((r: any) => String(r[fieldName]) === String(val));
            }
          }
        }

        if (sqlLower.includes("order by")) {
          const orderMatch = sql.match(/order by\s+([a-zA-Z0-9_]+)\s+(asc|desc)?/i);
          if (orderMatch) {
            const field = orderMatch[1];
            const desc = orderMatch[2] && orderMatch[2].toLowerCase() === "desc";
            rows = [...rows].sort((a: any, b: any) => {
              if (a[field] < b[field]) return desc ? 1 : -1;
              if (a[field] > b[field]) return desc ? -1 : 1;
              return 0;
            });
          }
        }

        const limitMatch = sqlLower.match(/limit\s+(\d+)/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1], 10);
          rows = rows.slice(0, limit);
        }

        if (callback) {
          setTimeout(() => callback(null, rows), 1);
        }
      } else {
        if (callback) {
          setTimeout(() => callback(null, []), 1);
        }
      }
    } catch (e: any) {
      if (callback) {
        setTimeout(() => callback(e, null), 1);
      }
    }
  }

  prepare(sql: string) {
    const dbInstance = this;
    return {
      run(...args: any[]) {
        const callback = typeof args[args.length - 1] === "function" ? args[args.length - 1] : null;
        const params = callback ? args.slice(0, args.length - 1) : args;

        try {
          const state = dbInstance.loadState();
          const match = sql.match(/insert into\s+([a-zA-Z0-9_]+)/i);
          if (match) {
            const tableName = match[1];
            if (!state.tables[tableName]) {
              state.tables[tableName] = [];
            }

            const idVal = params[0];
            const projIdVal = params[1];
            const nameVal = params[2];
            const categoryVal = params[3];
            const codeSnippetVal = params[4];
            const structureJsonVal = params[5];

            const row = {
              id: idVal,
              project_id: projIdVal,
              name: nameVal,
              category: categoryVal,
              code_snippet: codeSnippetVal,
              structure_json: structureJsonVal,
              created_at: new Date().toISOString()
            };

            const existingIdx = state.tables[tableName].findIndex((r: any) => String(r.id) === String(idVal));
            if (existingIdx > -1) {
              state.tables[tableName][existingIdx] = { ...state.tables[tableName][existingIdx], ...row };
            } else {
              state.tables[tableName].push(row);
            }

            dbInstance.saveState(state);
            if (callback) {
              setTimeout(() => callback(null), 1);
            }
          }
        } catch (e: any) {
          if (callback) {
            setTimeout(() => callback(e), 1);
          }
        }
      }
    };
  }
}

const sqlite3Mock = {
  OPEN_READONLY: 1,
  Database: MockDatabase
};

export default sqlite3Mock;
