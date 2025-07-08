const totalImported = results.reduce((sum, result) => sum + (result.importedCount || 0), 0); 

// Si results es Response[], hacer:
// const importedResults = results.map(r => ({ importedCount: r.importedCount }));
// const totalImported = importedResults.reduce((sum, result) => sum + (result.importedCount || 0), 0);
// O ajustar el reduce para que acepte el tipo correcto. 