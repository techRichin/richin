import * as Exceljs from 'exceljs';
import { writeFileSync } from 'fs';
// Create a new instance of the Excel workbook
const workbook = new Exceljs.default.Workbook();

// Load the Excel file
workbook.xlsx.readFile('stockSymbolExcel.xlsx')
    .then(() => {
        // Assuming your data is in the first worksheet
        const worksheet = workbook.getWorksheet(1);

        // Create an empty object for the name to symbol mapping
        const nameToSymbolMap = {};

        // Iterate through each row in the worksheet
        worksheet.eachRow((row, rowNumber) => {
            // Assuming the name is in column A and the symbol is in column B
            const name = row.getCell(1).value;
            const symbol = row.getCell(2).value;

            // Add the name and symbol to the mapping object
            if (name && symbol) {
                nameToSymbolMap[name] = symbol;
            }
        });

        // Convert the object to JSON
        const jsonData = JSON.stringify(nameToSymbolMap, null, 2);

        // Write the JSON data to a file
        writeFileSync('./nameToSymbolMap.json', jsonData, 'utf8');

        console.log('JSON file created successfully.');
    })
    .catch(error => {
        console.error('Error reading the Excel file:', error);
    });
