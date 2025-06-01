import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';

async function fetchAndSavePage(url: string, outputDir: string): Promise<void> {
  try {
    console.log(`Fetching: ${url}`);
    
    // Extract a filename from the URL
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const filename = pathSegments[pathSegments.length - 1] || 'index';
    
    const outputPath = path.join(outputDir, `${filename}.html`);
    
    // Fetch the page content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Save the HTML content to a file
    await fs.writeFile(outputPath, response.data);
    console.log(`Successfully saved: ${outputPath}`);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error instanceof Error ? error.message : error);
  }
}

async function main() {
  const linksFilePath = path.resolve(process.cwd(), 'links.txt');
  const outputDir = path.resolve(process.cwd(), 'pages');
  
  try {
    // Ensure the output directory exists
    await fs.ensureDir(outputDir);
    
    // Read links from the file
    const content = await fs.readFile(linksFilePath, 'utf8');
    const links = content.split('\n').filter(link => link.trim() !== '');
    
    console.log(`Found ${links.length} links to process`);
    
    // Process links with a small delay between requests to avoid rate limiting
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      await fetchAndSavePage(link, outputDir);
      
      // Add a small delay between requests
      if (i < links.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('All pages have been fetched and saved successfully!');
  } catch (error) {
    console.error('Error in main process:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();