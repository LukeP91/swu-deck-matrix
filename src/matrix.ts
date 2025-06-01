import * as fs from 'fs-extra';
import * as path from 'path';

interface Card {
  count: number;
  name: string;
  subtitle?: string;
}

interface DeckSection {
  leaders: Card[];
  base: Card[];
  deck: Card[];
  sideboard: Card[];
}

interface CardFrequency {
  cardName: string;
  mainDeckCount: number;
  mainDeckPercent: string;
  mainDeckTotalCopies: number;
  mainDeckAvgCopies: string;
  mainDeckMedian: string;
  mainDeckMode: string;
  sideboardCount: number;
  sideboardPercent: string;
  sideboardTotalCopies: number;
  sideboardAvgCopies: string;
  sideboardMedian: string;
  sideboardMode: string;
}

function parseDecklistFile(content: string): DeckSection {
  const lines = content.split('\n');
  
  const result: DeckSection = {
    leaders: [],
    base: [],
    deck: [],
    sideboard: []
  };
  
  let currentSection: keyof DeckSection | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;
    
    // Check if this is a section header
    if (trimmedLine === 'Leaders') {
      currentSection = 'leaders';
    } else if (trimmedLine === 'Base') {
      currentSection = 'base';
    } else if (trimmedLine === 'Deck') {
      currentSection = 'deck';
    } else if (trimmedLine === 'Sideboard') {
      currentSection = 'sideboard';
    } else if (currentSection) {
      // Parse card entry
      // Format: "3 | Krayt Dragon" or "3 | Han Solo | Worth the Risk"
      const parts = trimmedLine.split(' | ');
      
      if (parts.length >= 2) {
        const count = parseInt(parts[0], 10);
        const name = parts[1];
        const subtitle = parts.length >= 3 ? parts[2] : undefined;
        
        if (!isNaN(count)) {
          result[currentSection].push({ count, name, subtitle });
        }
      }
    }
  }
  
  return result;
}

function getFullCardName(card: Card): string {
  if (card.subtitle) {
    return `${card.name} | ${card.subtitle}`;
  }
  return card.name;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

function calculateMode(values: number[]): number {
  if (values.length === 0) return 0;
  
  const frequency: { [key: number]: number } = {};
  values.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  
  let maxFreq = 0;
  let mode = 0;
  
  for (const [value, freq] of Object.entries(frequency)) {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = parseInt(value);
    }
  }
  
  return mode;
}

async function buildMatrix() {
  try {
    // Define paths
    const decklistsDir = path.join(process.cwd(), 'decklists');
    const outputPath = path.join(process.cwd(), 'card_matrix.csv');
    
    // Check if decklists directory exists
    if (!await fs.pathExists(decklistsDir)) {
      console.error('Decklists directory not found!');
      process.exit(1);
    }
    
    // Read all txt files
    const files = await fs.readdir(decklistsDir);
    const txtFiles = files.filter(file => file.endsWith('.txt'));
    
    if (txtFiles.length === 0) {
      console.error('No decklist files found!');
      process.exit(1);
    }
    
    console.log(`Found ${txtFiles.length} decklist files to process`);
    
    // Maps to track card frequencies and copy counts
    const mainDeckFrequency: Map<string, number> = new Map();
    const mainDeckCopies: Map<string, number> = new Map();
    const mainDeckCopyArrays: Map<string, number[]> = new Map();
    const sideboardFrequency: Map<string, number> = new Map();
    const sideboardCopies: Map<string, number> = new Map();
    const sideboardCopyArrays: Map<string, number[]> = new Map();
    
    // Process each decklist file
    for (const file of txtFiles) {
      const filePath = path.join(decklistsDir, file);
      console.log(`Processing: ${file}`);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const decklist = parseDecklistFile(content);
        
        // Process main deck (leaders + base + deck)
        [...decklist.leaders, ...decklist.base, ...decklist.deck].forEach(card => {
          const fullName = getFullCardName(card);
          // Increment deck count (how many decks include this card)
          mainDeckFrequency.set(fullName, (mainDeckFrequency.get(fullName) || 0) + 1);
          // Add to total copies count
          mainDeckCopies.set(fullName, (mainDeckCopies.get(fullName) || 0) + card.count);
          // Store individual copy counts for median/mode calculation
          if (!mainDeckCopyArrays.has(fullName)) {
            mainDeckCopyArrays.set(fullName, []);
          }
          mainDeckCopyArrays.get(fullName)!.push(card.count);
        });
        
        // Process sideboard
        decklist.sideboard.forEach(card => {
          const fullName = getFullCardName(card);
          // Increment sideboard count (how many sideboards include this card)
          sideboardFrequency.set(fullName, (sideboardFrequency.get(fullName) || 0) + 1);
          // Add to total copies count
          sideboardCopies.set(fullName, (sideboardCopies.get(fullName) || 0) + card.count);
          // Store individual copy counts for median/mode calculation
          if (!sideboardCopyArrays.has(fullName)) {
            sideboardCopyArrays.set(fullName, []);
          }
          sideboardCopyArrays.get(fullName)!.push(card.count);
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    // Combine data for CSV output
    const allCardNames = new Set([
      ...mainDeckFrequency.keys(),
      ...sideboardFrequency.keys()
    ]);
    
    const totalDecklists = txtFiles.length;
    
    const matrixData: CardFrequency[] = Array.from(allCardNames).map(cardName => {
      const mainDeckCount = mainDeckFrequency.get(cardName) || 0;
      const mainDeckTotalCopies = mainDeckCopies.get(cardName) || 0;
      const mainDeckAvgCopies = mainDeckCount > 0 ? mainDeckTotalCopies / mainDeckCount : 0;
      const mainDeckCopyArray = mainDeckCopyArrays.get(cardName) || [];
      const mainDeckMedian = calculateMedian(mainDeckCopyArray);
      const mainDeckMode = calculateMode(mainDeckCopyArray);
      
      const sideboardCount = sideboardFrequency.get(cardName) || 0;
      const sideboardTotalCopies = sideboardCopies.get(cardName) || 0;
      const sideboardAvgCopies = sideboardCount > 0 ? sideboardTotalCopies / sideboardCount : 0;
      const sideboardCopyArray = sideboardCopyArrays.get(cardName) || [];
      const sideboardMedian = calculateMedian(sideboardCopyArray);
      const sideboardMode = calculateMode(sideboardCopyArray);
      
      return {
        cardName,
        mainDeckCount,
        mainDeckPercent: `${((mainDeckCount / totalDecklists) * 100).toFixed(2)}%`,
        mainDeckTotalCopies,
        mainDeckAvgCopies: mainDeckAvgCopies.toFixed(2),
        mainDeckMedian: mainDeckMedian.toFixed(2),
        mainDeckMode: mainDeckMode.toString(),
        sideboardCount,
        sideboardPercent: `${((sideboardCount / totalDecklists) * 100).toFixed(2)}%`,
        sideboardTotalCopies,
        sideboardAvgCopies: sideboardAvgCopies.toFixed(2),
        sideboardMedian: sideboardMedian.toFixed(2),
        sideboardMode: sideboardMode.toString()
      };
    });
    
    // Sort by main deck frequency (highest first)
    matrixData.sort((a, b) => {
      // First sort by main deck count
      if (b.mainDeckCount !== a.mainDeckCount) {
        return b.mainDeckCount - a.mainDeckCount;
      }
      // If main deck counts are equal, sort by sideboard count
      return b.sideboardCount - a.sideboardCount;
    });
    
    // Create CSV content
    const headers = "Card Name,Main Deck Count,Main Deck %,Main Deck Avg Copies,Main Deck Median,Main Deck Mode,Sideboard Count,Sideboard %,Sideboard Avg Copies,Sideboard Median,Sideboard Mode\n";
    let csvContent = headers;
    
    // Add rows for each card
    for (const row of matrixData) {
      csvContent += `"${row.cardName}",${row.mainDeckCount},${row.mainDeckPercent},${row.mainDeckAvgCopies},${row.mainDeckMedian},${row.mainDeckMode},${row.sideboardCount},${row.sideboardPercent},${row.sideboardAvgCopies},${row.sideboardMedian},${row.sideboardMode}\n`;
    }
    
    // Write the CSV file
    await fs.writeFile(outputPath, csvContent);
    console.log(`Matrix has been saved to: ${outputPath}`);
    
    // Print statistics to console
    console.log(`\n=== Card Frequency Analysis ===`);
    console.log(`Total unique cards: ${allCardNames.size}`);
    console.log(`Total decklists analyzed: ${totalDecklists}`);
    
    console.log(`\nTop 10 Most Common Cards in Main Deck:`);
    console.log(`----------------------------------------`);
    matrixData.slice(0, 10).forEach((card, index) => {
      console.log(`${index + 1}. ${card.cardName}`);
      console.log(`   Main Deck: ${card.mainDeckCount}/${totalDecklists} decks (${card.mainDeckPercent})`);
      console.log(`   Avg: ${card.mainDeckAvgCopies}, Median: ${card.mainDeckMedian}, Mode: ${card.mainDeckMode} copies`);
      if (parseInt(card.sideboardCount.toString()) > 0) {
        console.log(`   Sideboard: ${card.sideboardCount}/${totalDecklists} decks (${card.sideboardPercent})`);
        console.log(`   Avg: ${card.sideboardAvgCopies}, Median: ${card.sideboardMedian}, Mode: ${card.sideboardMode} copies`);
      }
    });
    
    // Sort by sideboard frequency and show top sideboard cards
    const sideboardData = [...matrixData].sort((a, b) => b.sideboardCount - a.sideboardCount);
    console.log(`\nTop 5 Most Common Sideboard Cards:`);
    console.log(`----------------------------------------`);
    sideboardData.filter(card => card.sideboardCount > 0).slice(0, 5).forEach((card, index) => {
      console.log(`${index + 1}. ${card.cardName}`);
      console.log(`   Sideboard: ${card.sideboardCount}/${totalDecklists} decks (${card.sideboardPercent})`);
      console.log(`   Avg: ${card.sideboardAvgCopies}, Median: ${card.sideboardMedian}, Mode: ${card.sideboardMode} copies`);
      if (parseInt(card.mainDeckCount.toString()) > 0) {
        console.log(`   Main Deck: ${card.mainDeckCount}/${totalDecklists} decks (${card.mainDeckPercent})`);
        console.log(`   Avg: ${card.mainDeckAvgCopies}, Median: ${card.mainDeckMedian}, Mode: ${card.mainDeckMode} copies`);
      }
    });
    
  } catch (error) {
    console.error('Error building matrix:', error);
    process.exit(1);
  }
}

buildMatrix();