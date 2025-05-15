const express = require('express');  
const cors = require('cors');  
const path = require('path');  
const fs = require('fs');  
  
// Configuration  
const PORT = 9567;  
const ASSETS_DIR = path.join(__dirname, 'public');  
  
// Create Express app  
const app = express();  
app.use(cors());  
  
// Status endpoint  
app.get('/status', (req, res) => {  
  res.json({  
    status: "ok",  
    version: 1,  
    message: "AssetServer is running"  
  });  
});  
  
// Item info endpoint  
app.get('/items/:itemId', (req, res) => {  
  const itemId = req.params.itemId;  
  const itemDir = findItemDirectory(itemId);  
    
  if (!itemDir) {  
    return res.status(404).json({ error: "Item not found" });  
  }  
    
  // Return item info with manifest URL  
  res.json({  
    option: {  
      version: 1,  
    },  
    resource: {  
      manifest: `http://localhost:${PORT}/${itemDir}/manifest.json`,  
    }  
  });  
});  
  
// Generate manifest.json if it doesn't exist - FIXED  
app.get(/.*\/manifest\.json$/, (req, res) => {  
  const filepath = path.join(ASSETS_DIR, req.path);  
    
  if (!fs.existsSync(filepath)) {  
    // Extract directory name for GLB filename  
    const dirPath = path.dirname(filepath);  
    const dirName = path.basename(dirPath);  
      
    // Create a basic manifest  
    const manifest = {  
      format: 3,  
      main: {  
        type: "Model_glb",  
        modelfile: `${dirName}.glb`  
      }  
    };  
      
    return res.json(manifest);  
  }  
    
  // If manifest exists, serve it  
  res.sendFile(filepath);  
});  
  
// Generate package.json if it doesn't exist - FIXED  
app.get(/.*\/package\.json$/, (req, res) => {  
  const dirPath = path.dirname(path.join(ASSETS_DIR, req.path));  
  const files = fs.readdirSync(dirPath);  
    
  res.json({  
    files: files.map(file => path.basename(file))  
  });  
});  
  
// Serve static files  
app.use(express.static(ASSETS_DIR));  
  
// Helper function to find item directory  
function findItemDirectory(itemId) {  
  // In a real implementation, you would look up the item in a database  
  // For simplicity, we'll assume the itemId is the directory name  
  const itemDir = path.join(ASSETS_DIR, itemId);  
    
  if (fs.existsSync(itemDir) && fs.statSync(itemDir).isDirectory()) {  
    return itemId;  
  }  
    
  return null;  
}  
  
// Start server  
app.listen(PORT, () => {  
  console.log(`Asset server running at http://localhost:${PORT}`);  
  console.log(`Serving assets from ${ASSETS_DIR}`);  
});