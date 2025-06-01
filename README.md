# SWU Competitive Matrix

A TypeScript Node.js application that fetches HTML pages from URLs, extracts card lists, and generates comprehensive statistical analysis of Star Wars Unlimited competitive decklists.

## Features

- **Web Scraping**: Fetches HTML pages from URLs stored in a text file
- **Content Extraction**: Extracts card lists from specific HTML elements
- **Statistical Analysis**: Generates comprehensive card frequency matrix with:
  - Deck count and percentage
  - Average, median, and mode (dominant) number of copies
  - Separate analysis for main deck and sideboard

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

## Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd swu-competetive-matrix
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### 1. Prepare Links File

Create a `links.txt` file in the project root with one URL per line:
```
https://melee.gg/Decklist/View/5dc26b7a-ff6a-44f0-a459-b2ed01560856
https://melee.gg/Decklist/View/be5abb5e-e24f-4568-a3c7-b2ed015ffa2a
https://melee.gg/Decklist/View/4368bc6e-b029-4cd2-8e54-b2ee0076f210
```

### 2. Fetch HTML Pages

Download HTML content from all URLs in `links.txt`:
```bash
npm run dev
```

This creates HTML files in the `pages/` directory.

### 3. Extract Card Lists

Extract card lists from HTML files and save them as text files:
```bash
npm run extract
```

This creates text files in the `decklists/` directory with clean card list data.

### 4. Generate Analysis Matrix

Create a comprehensive statistical analysis of all decklists:
```bash
npm run matrix
```

This generates `card_matrix.csv` with detailed statistics for each card.

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the HTML fetcher (compiled version)
- `npm run dev` - Build and run HTML fetcher
- `npm run extract` - Build and run card list extractor
- `npm run matrix` - Build and run statistical analysis

## Output Files

### card_matrix.csv

A comprehensive CSV file containing:
- **Card Name**: Full card name with subtitle
- **Main Deck Count**: Number of decks playing the card in main deck
- **Main Deck %**: Percentage of decks playing the card in main deck
- **Main Deck Avg Copies**: Average number of copies when played in main deck
- **Main Deck Median**: Median number of copies in main deck
- **Main Deck Mode**: Most common number of copies in main deck
- **Sideboard Count**: Number of decks playing the card in sideboard
- **Sideboard %**: Percentage of decks playing the card in sideboard
- **Sideboard Avg Copies**: Average number of copies when played in sideboard
- **Sideboard Median**: Median number of copies in sideboard
- **Sideboard Mode**: Most common number of copies in sideboard

## Project Structure

```
swu-competetive-matrix/
├── README.md              # This file
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .gitignore             # Git ignore rules
├── links.txt.example      # Example URLs file
├── links.txt              # Input URLs (create from example)
├── card_matrix.csv        # Output analysis (generated)
├── src/                   # Source TypeScript files
│   ├── index.ts           # HTML fetcher
│   ├── extract.ts         # Card list extractor
│   └── matrix.ts          # Statistical analyzer
├── dist/                  # Compiled JavaScript (generated)
├── pages/                 # Downloaded HTML files (generated)
└── decklists/             # Extracted card lists (generated)
```

## Data Flow

1. **Input**: URLs in `links.txt`
2. **Fetch**: HTML pages saved to `pages/`
3. **Extract**: Card lists saved to `decklists/`
4. **Analyze**: Statistics saved to `card_matrix.csv`

## Supported HTML Format

The extractor looks for card data in HTML elements with:
```html
<pre class="d-none" id="decklist-swu-text">
```

Card format expected:
```
Leaders
1 | Han Solo | Worth the Risk

Base
1 | Data Vault

Deck
3 | Krayt Dragon
2 | Cassian Andor | Rebellions Are Built On Hope

Sideboard
2 | Salvage
3 | Bombing Run
```

## Error Handling

- Missing files or directories are automatically created
- Failed HTTP requests are logged but don't stop the process
- Invalid card formats are skipped with warnings
- Compilation errors are shown with TypeScript diagnostics

## Contributing

1. Ensure TypeScript compiles without errors: `npm run build`
2. Test all scripts work correctly
3. Update README if adding new features

## License

MIT License - see [LICENSE](LICENSE) file for details