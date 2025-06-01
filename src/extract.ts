import * as fs from 'fs-extra';
import * as path from 'path';
import { JSDOM } from 'jsdom';

async function extractDecklistFromHtml(filePath: string): Promise<string | null> {
  try {
    // Read the HTML file content
    const htmlContent = await fs.readFile(filePath, 'utf8');
    
    // Parse the HTML using JSDOM
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Find the pre element with the specified class and id
    const preElement = document.querySelector('pre.d-none#decklist-swu-text');
    
    if (!preElement || !preElement.textContent) {
      console.log(`No decklist content found in ${filePath}`);
      return null;
    }
    
    return preElement.textContent.trim();
  } catch (error) {
    console.error(`Error extracting content from ${filePath}:`, error);
    return null;
  }
}

async function cleanupTextFiles() {
  // Remove existing txt files from pages directory
  const pagesDir = path.join(process.cwd(), 'pages');
  const files = await fs.readdir(pagesDir);
  const txtFiles = files.filter(file => file.endsWith('.txt'));
  
  for (const txtFile of txtFiles) {
    const filePath = path.join(pagesDir, txtFile);
    await fs.remove(filePath);
    console.log(`Removed: ${filePath}`);
  }
  
  console.log(`Cleaned up ${txtFiles.length} text files from pages directory`);
}

async function main() {
  try {
    // Get the pages directory path
    const pagesDir = path.join(process.cwd(), 'pages');
    const decklistsDir = path.join(process.cwd(), 'decklists');
    
    // Check if the directories exist
    if (!await fs.pathExists(pagesDir)) {
      console.error(`Pages directory not found: ${pagesDir}`);
      process.exit(1);
    }
    
    // Ensure decklists directory exists
    await fs.ensureDir(decklistsDir);
    
    // Clean up existing text files from pages directory
    await cleanupTextFiles();
    
    // Get all HTML files in the pages directory
    const files = await fs.readdir(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Found ${htmlFiles.length} HTML files to process`);
    
    // Process each HTML file
    for (const htmlFile of htmlFiles) {
      const htmlPath = path.join(pagesDir, htmlFile);
      const txtPath = path.join(decklistsDir, `${path.basename(htmlFile, '.html')}.txt`);
      
      console.log(`Processing: ${htmlFile}`);
      
      // Extract the decklist content
      const decklistContent = await extractDecklistFromHtml(htmlPath);
      
      // If content was found, save it to a text file
      if (decklistContent) {
        await fs.writeFile(txtPath, decklistContent);
        console.log(`Successfully extracted decklist to: ${txtPath}`);
      }
    }
    
    console.log('Extraction completed successfully!');
  } catch (error) {
    console.error('Error in extraction process:', error);
    process.exit(1);
  }
}

main();