import React, { useState, useEffect } from "react";
import { 
  Database, Table, Plus, Play, Trash2, Edit, Save, RefreshCw, Layers, CheckCircle 
} from "lucide-react";

interface DbColumn {
  name: string;
  type: string;
  isPrimary: boolean;
}

interface DbTable {
  name: string;
  columns: DbColumn[];
  rowCount: number;
}

interface DatabaseManagerProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
  connectionString?: string;
  activeDbProvider: string;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({
  projectId,
  apiFetch,
  showToast,
  connectionString,
  activeDbProvider
}) => {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [columns, setColumns] = useState<DbColumn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Schema creation states
  const [newTableName, setNewTableName] = useState<string>("");
  const [newColumns, setNewColumns] = useState<{ name: string; type: string; isPrimary: boolean }[]>([
    { name: "id", type: "INTEGER", isPrimary: true },
    { name: "name", type: "TEXT", isPrimary: false }
  ]);

  // Record creation/edit states
  const [activeRecord, setActiveRecord] = useState<any | null>(null);
  const [isInserting, setIsInserting] = useState<boolean>(false);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/toolkit/db/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          connectionString,
          action: "list"
        })
      });
      if (res.tables) {
        setTables(res.tables);
        if (res.tables.length > 0 && !selectedTable) {
          setSelectedTable(res.tables[0].name);
        }
      }
    } catch (err: any) {
      showToast("Failed to retrieve database schema tables", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecords = async (tableName: string) => {
    if (!tableName) return;
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/toolkit/db/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          connectionString,
          tableName,
          action: "select"
        })
      });
      if (res.records) {
        setRecords(res.records);
        // Find columns of this table
        const tbl = tables.find(t => t.name === tableName);
        if (tbl) {
          setColumns(tbl.columns);
        } else if (res.records.length > 0) {
          // Fallback guess columns from keys
          const keys = Object.keys(res.records[0]);
          setColumns(keys.map(k => ({ name: k, type: "TEXT", isPrimary: k === "id" })));
        }
      }
    } catch (err: any) {
      showToast("Failed to retrieve table records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [projectId, connectionString, activeDbProvider]);

  useEffect(() => {
    if (selectedTable) {
      fetchRecords(selectedTable);
    }
  }, [selectedTable, tables]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName) return;
    try {
      const res = await apiFetch("/api/toolkit/db/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          connectionString,
          action: "create",
          tableName: newTableName,
          columns: newColumns
        })
      });
      if (res.success) {
        showToast(`Table ${newTableName} created successfully`, "success");
        setNewTableName("");
        fetchTables();
      }
    } catch (err) {
      showToast("Schema modification failure", "error");
    }
  };

  const handleAddColumnField = () => {
    setNewColumns(prev => [...prev, { name: "", type: "TEXT", isPrimary: false }]);
  };

  const handleInsertRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !activeRecord) return;
    try {
      const res = await apiFetch("/api/toolkit/db/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          connectionString,
          tableName: selectedTable,
          action: "insert",
          record: activeRecord
        })
      });
      if (res.success) {
        showToast("Record inserted into DB.", "success");
        setIsInserting(false);
        setActiveRecord(null);
        fetchRecords(selectedTable);
      }
    } catch (err) {
      showToast("Record insertion error", "error");
    }
  };

  const handleUpdateRecord = async (record: any) => {
    if (!selectedTable) return;
    // Find primary key
    const pk = columns.find(c => c.isPrimary) || columns[0];
    if (!pk) return;

    try {
      const res = await apiFetch("/api/toolkit/db/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          connectionString,
          tableName: selectedTable,
          action: "update",
          idField: pk.name,
          idVal: record[pk.name],
          record
        })
      });
      if (res.success) {
        showToast("Record updated successfully.", "success");
        fetchRecords(selectedTable);
      }
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  const handleDeleteRecord = async (record: any) => {
    if (!selectedTable) return;
    const pk = columns.find(c => c.isPrimary) || columns[0];
    if (!pk) return;

    try {
      const res = await apiFetch("/api/toolkit/db/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          connectionString,
          tableName: selectedTable,
          action: "delete",
          idField: pk.name,
          idVal: record[pk.name]
        })
      });
      if (res.success) {
        showToast("Record removed from table", "warn");
        fetchRecords(selectedTable);
      }
    } catch (err) {
      showToast("Deletion failed", "error");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0A0B10] overflow-hidden">
      {/* Sidebar: Table Selector & DDL Tool */}
      <div className="w-full md:w-80 border-r border-[#2D3039] bg-[#0E1015] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Tables Catalog</span>
            <span className="text-[8px] font-mono font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 px-1.5 py-0.2 rounded uppercase">{activeDbProvider}</span>
          </div>
          <h4 className="text-xs font-sans text-slate-200 font-bold">Workspace Schemas</h4>
        </div>

        {/* Existing Tables list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {tables.length === 0 ? (
            <div className="p-4 text-center font-mono text-[10px] text-slate-600 border border-dashed border-slate-900 rounded-lg">
              No custom tables declared in this schema node. Use form below to scaffold!
            </div>
          ) : (
            tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedTable === t.name 
                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" 
                  : "border border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Table size={13} className={selectedTable === t.name ? "text-indigo-400" : "text-slate-500"} />
                  <span className="truncate">{t.name}</span>
                </div>
                <span className="text-[9px] text-slate-600 font-bold uppercase">{t.columns.length} Cols</span>
              </button>
            ))
          )}
        </div>

        {/* DDL Schema Table Creater */}
        <div className="p-4 border-t border-[#2D3039] bg-slate-950/40">
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-2">Create New Schema Table</span>
          <form onSubmit={handleCreateTable} className="space-y-3 font-mono text-[10px]">
            <div>
              <input 
                type="text" 
                placeholder="Table Name (e.g. analytics)"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {newColumns.map((col, idx) => (
                <div key={idx} className="flex gap-1.5 items-center">
                  <input 
                    type="text"
                    placeholder="Col Name"
                    value={col.name}
                    onChange={(e) => {
                      const updated = [...newColumns];
                      updated[idx].name = e.target.value;
                      setNewColumns(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white focus:outline-none"
                    required
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const updated = [...newColumns];
                      updated[idx].type = e.target.value;
                      setNewColumns(updated);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white focus:outline-none"
                  >
                    <option value="INTEGER">INT</option>
                    <option value="TEXT">TEXT</option>
                    <option value="VARCHAR(255)">VARCHAR</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleAddColumnField}
                className="flex-1 py-1 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] text-slate-400 hover:text-white rounded text-[10px] cursor-pointer"
              >
                + Add Column
              </button>
              <button
                type="submit"
                className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold rounded text-[10px] cursor-pointer"
              >
                Deploy Table
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Pane: Table Editor */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
        <div className="h-12 border-b border-[#2D3039] bg-[#0E1015] px-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {selectedTable ? `Records of: ${selectedTable}` : "Database Manager"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedTable) fetchRecords(selectedTable);
              }}
              className="p-1.5 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] rounded text-slate-400 hover:text-white cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw size={12} />
            </button>
            {selectedTable && (
              <button
                onClick={() => {
                  const r: any = {};
                  columns.forEach(c => r[c.name] = "");
                  setActiveRecord(r);
                  setIsInserting(true);
                }}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={12} />
                <span>Insert Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Records spreadsheet view */}
        <div className="flex-1 overflow-auto p-4">
          {isInserting && activeRecord && (
            <form onSubmit={handleInsertRecord} className="mb-4 p-4 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-3 font-mono text-xs max-w-lg">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-indigo-400 font-bold uppercase text-[10px]">Insert Schema Record</span>
                <button type="button" onClick={() => setIsInserting(false)} className="text-slate-500 hover:text-white">Cancel</button>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {columns.map((c) => (
                  <div key={c.name} className="space-y-0.5">
                    <label className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">{c.name} ({c.type})</label>
                    <input 
                      type="text"
                      value={activeRecord[c.name]}
                      onChange={(e) => setActiveRecord({ ...activeRecord, [c.name]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-semibold font-sans rounded-lg">
                Commit Insert Statement
              </button>
            </form>
          )}

          {records.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center p-8 text-center text-slate-600 border border-dashed border-slate-900 rounded-xl">
              <Database size={32} className="mb-2" />
              <p className="text-xs font-semibold">Table contains no records</p>
              <p className="text-[10px] mt-1">Insert a custom row visually above to populate this Postgres/SQLite table.</p>
            </div>
          ) : (
            <div className="border border-[#2D3039] bg-slate-950 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] leading-relaxed">
                  <thead>
                    <tr className="bg-[#0E1015] border-b border-[#2D3039] text-slate-500 uppercase tracking-wider font-bold">
                      {columns.map(col => (
                        <th key={col.name} className="px-4 py-2.5">{col.name}</th>
                      ))}
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, rIdx) => (
                      <tr key={rIdx} className="border-b border-[#2D3039]/55 hover:bg-[#0E1015]/30">
                        {columns.map(col => (
                          <td key={col.name} className="px-4 py-3 text-slate-300">
                            <input 
                              type="text" 
                              defaultValue={rec[col.name]} 
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val !== rec[col.name]) {
                                  rec[col.name] = val;
                                  handleUpdateRecord(rec);
                                }
                              }}
                              className="bg-transparent border-0 text-slate-300 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 px-1 rounded w-full"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteRecord(rec)}
                            className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Delete Row Record"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
