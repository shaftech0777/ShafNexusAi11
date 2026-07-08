sed -i 's/const dir = getWorkspaceDir(projectId);/const dir = getWorkspaceDir(projectId);\n    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });/g' server.ts
