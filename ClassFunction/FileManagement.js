import fs from "fs";

class FileManagement {
    constructor() {}
    readFile(filePath) {
      try {
        const data = fs.readFileSync(filePath, "utf-8");
        return data;
      } catch (error) {
        console.error("Error reading file:", error);
        return null;
      }
    }
  }

  export { FileManagement };