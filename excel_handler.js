// Check if we are on the template editor page
if (window.location.pathname.includes('template_editor.html')) {
    loadExcelTemplate(); // Load and display the Excel file for editing
}

document.getElementById('uploadButton')?.addEventListener('click', handleUpload);
document.getElementById('proceedButton')?.addEventListener('click', proceedToTemplate);
document.getElementById('saveChangesButton')?.addEventListener('click', saveChanges);
document.getElementById('downloadExcelButton')?.addEventListener('click', downloadUpdatedExcel);

let originalData = []; // Store the original data from Excel
let handsontableInstance; // Reference to the Handsontable instance
let workbook; // Reference to the Excel workbook object

// Handle the upload process including criteria validation
function handleUpload() {
    const criteriaNumber = document.getElementById('criteriaNumber').value.trim();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!criteriaNumber) {
        alert('Please enter the criteria number.');
        return;
    }

    if (!file || !(file.type.includes('sheet') || file.type.includes('excel'))) {
        alert('Please upload a valid Excel file.');
        return;
    }

    // Save criteria number and file details in session storage
    sessionStorage.setItem('criteriaNumber', criteriaNumber);
    saveFileToSession(file);
    saveFileDetails(criteriaNumber, file);

    const reader = new FileReader();
    reader.onload = function (e) {
        sessionStorage.setItem('uploadedExcel', e.target.result); // Save the Excel file data
        document.getElementById('proceedButton').disabled = false; // Enable the proceed button
    };
    reader.readAsDataURL(file);
}

// Function to save file details in session storage
function saveFileToSession(file) {
    const fileDetails = {
        name: file.name,
        type: file.type,
        size: file.size,
    };
    sessionStorage.setItem('uploadedFileDetails', JSON.stringify(fileDetails));
}

// Proceed to template editor page
function proceedToTemplate() {
    window.location.href = 'template_editor.html'; // Redirect to the template editor page
}

// Function to display file details on the dashboard
function saveFileDetails(criteriaNumber, file) {
    const uploadTime = new Date().toLocaleString();
    const tableBody = document.querySelector('#fileTable tbody');

    if (!tableBody) {
        console.error("File details table body not found!");
        return;
    }

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${criteriaNumber}</td>
        <td>${file.name}</td>
        <td>${uploadTime}</td>
    `;
    tableBody.appendChild(newRow);

    // Logging for debugging
    console.log("File details saved:", {
        criteriaNumber: criteriaNumber,
        fileName: file.name,
        uploadTime: uploadTime,
    });
}

// Function to load and display the Excel template for editing
function loadExcelTemplate() {
    const fileData = sessionStorage.getItem('uploadedExcel');
    const criteriaNumber = sessionStorage.getItem('criteriaNumber'); // Get criteria number from session storage

    if (!fileData) {
        alert('No Excel file data found.');
        return;
    }

    // Display the criteria number on the template editor page
    if (criteriaNumber) {
        document.getElementById('criteriaDisplay').textContent = `Criteria Number: ${criteriaNumber}`;
    }

    fetch(fileData)
        .then(res => res.arrayBuffer())
        .then(buffer => {
            try {
                workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                populateSheetDropdown(workbook.SheetNames); // Populate the dropdown with sheet names
                loadSheet(workbook.SheetNames[0]); // Load the first sheet by default
            } catch (error) {
                console.error('Error reading Excel file:', error);
                alert('There was an error processing the Excel file. Please check the file format.');
            }
        })
        .catch(error => {
            console.error('Error fetching file:', error);
            alert('Failed to fetch the uploaded Excel file.');
        });
}

// Function to populate the dropdown with sheet names
function populateSheetDropdown(sheetNames) {
    const dropdown = document.getElementById('sheetDropdown');
    dropdown.innerHTML = ''; // Clear existing options

    sheetNames.forEach((sheetName, index) => {
        const option = document.createElement('option');
        option.value = sheetName;
        option.textContent = sheetName;
        dropdown.appendChild(option);
    });

    // Add event listener to load the selected sheet
    dropdown.addEventListener('change', function () {
        loadSheet(this.value);
    });
}

let currentSheetName = ''; // Keep track of the current sheet name

// Function to load a selected sheet by name
function loadSheet(sheetName) {
    // Save changes of the current sheet before loading the new one
    if (currentSheetName) {
        saveCurrentSheetData(currentSheetName);
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        alert('Unable to load the selected sheet.');
        return;
    }

    currentSheetName = sheetName; // Update the current sheet name

    // Convert sheet to a 2D array format
    originalData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }); // `defval: ''` fills empty cells

    if (originalData.length === 0) {
        alert('The selected sheet is empty or not readable.');
        return;
    }

    displayExcelContent(originalData);
}

// Function to save the current sheet data back to the workbook
function saveCurrentSheetData(sheetName) {
    const sheetData = handsontableInstance.getData(); // Get the current data from Handsontable
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData); // Convert data back to worksheet format
    workbook.Sheets[sheetName] = worksheet; // Update the workbook sheet with new data
}

// Global variable to keep track of whether listeners have been added
let keyboardShortcutsAdded = false;

// Display Excel content using Handsontable
function displayExcelContent(data) {
    const container = document.getElementById('excelTableContainer');
    container.innerHTML = ''; // Clear previous Handsontable instance if any

    // Extract headers from the first row of the data
    const headers = [];

    // Filter data to include only rows with text or relevant content
    let filteredData = data.filter(row => row.some(cell => cell !== null && cell.toString().trim() !== ''));

    // // Optionally, add a couple of extra rows for the user to have some space to work with
    // const extraRows = 2; // Number of extra rows to display
    // const emptyRow = Array(headers.length).fill(''); // Create an empty row template
    // for (let i = 0; i < extraRows; i++) {
    //     filteredData.push(emptyRow);
    // }

    // Initialize Handsontable with the filtered data
    handsontableInstance = new Handsontable(container, {
        data: filteredData,
        colHeaders: headers, // Set column headers explicitly
        rowHeaders: true,
        contextMenu: {
            items: {
                "row_above": { name: 'Insert row above' },
                "row_below": { name: 'Insert row below' },
                "remove_row": { name: 'Delete row' } // Add the option to delete rows
            }
        },
        manualColumnResize: true,
        manualRowResize: true,
        minSpareRows: 1, // Allows users to add new rows dynamically
        stretchH: 'all', // Stretch columns to fit the width
        autoWrapRow: true, // Enable auto row wrapping
        wordWrap: true, // Wrap text within cells
        colWidths: calculateResponsiveColWidths(headers.length), // Set column widths responsively
        rowHeights: calculateRowHeights(filteredData), // Dynamically adjust row heights
        headerHeight: 60, // Set header height explicitly to handle multiple lines
        licenseKey: 'non-commercial-and-evaluation', // Use appropriate license key for production
    });
        // Add the afterChange hook directly after initializing Handsontable
    handsontableInstance.addHook('afterChange', function (changes, source) {
        if (source !== 'loadData') {
            syncDataAndCheckCompletion(); // Check after any user-made change
        }
    });

    // Initial check on load to ensure the submit button state reflects the current data
    checkCompletion();
    // Add keyboard shortcuts only once
    if (!keyboardShortcutsAdded) {
        addKeyboardShortcuts(handsontableInstance);
        keyboardShortcutsAdded = true; // Mark that shortcuts have been added
    }
    
}

// Function to add keyboard shortcuts and manage event listeners
function addKeyboardShortcuts(handsontableInstance) {
    // Remove any existing listeners to avoid double execution
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);

    function handleKeyDown(event) {
        const hot = handsontableInstance;

        if (event.key === 'Delete') {
            // Delete key functionality
            const selected = hot.getSelected();
            if (selected) {
                const startRow = selected[0][0];
                const endRow = selected[0][2];
                hot.alter('remove_row', startRow, endRow - startRow + 1);
            }
        } else if (event.ctrlKey && event.key === 'c') {
            // Ctrl+C functionality (copy)
            hot.getPlugin('CopyPaste').copy();
            // console.log('Data copied to clipboard');
        } else if (event.ctrlKey && event.key === 'v') {
            // Ctrl+V functionality (paste)
            hot.getPlugin('CopyPaste').paste();
            // console.log('Data pasted from clipboard');
        } else if (event.ctrlKey && event.key === 'z') {
            // Ctrl+Z functionality (undo)
            hot.undo();
            // console.log('Undo action performed');
        }
    }
}

// Function to calculate column widths responsively to fit the screen without scrolling
function calculateResponsiveColWidths(columnCount) {
    const maxScreenWidth = window.innerWidth - 50; // Subtract some padding for aesthetics
    const maxColWidth = Math.min(150, maxScreenWidth / columnCount); // Limit maximum width for readability
    return Math.max(maxColWidth, 80); // Set a minimum width of 80px for readability
}

// Function to calculate row heights based on content
function calculateRowHeights(data) {
    return function (row) {
        const maxRowHeight = 100; // Maximum row height to avoid overly tall rows
        const minRowHeight = 40; // Minimum row height for readability
        const contentLength = data[row].reduce((acc, cell) => acc + (cell ? cell.toString().length : 0), 0);
        return Math.min(Math.max(contentLength / 10, minRowHeight), maxRowHeight);
    };
}

// Function to check completion of the 'Link to the relevant document' column across all sheets
function checkCompletion() {
    // Ensure workbook is loaded correctly
    if (!workbook || !workbook.SheetNames) {
        console.warn('Workbook is not defined or has not been loaded properly.');
        updateSubmitButton(false); 
        return;
    }

    let allSheetsComplete = true; // Flag to indicate if all sheets are complete

    // Iterate over each sheet in the workbook
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        let linkColumnIndices = []; // Array to store the indices of all "Link to the relevant document" columns
        let headerRowIndex = -1;  // Row index where the header is found

        // Find all columns that contain "Link to the relevant document" in the header row
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const row = data[rowIndex];

            // Find all columns that have "Link to the relevant document" in their header (with or without prefix)
            row.forEach((cell, colIndex) => {
                if (typeof cell === 'string' && cell.toLowerCase().includes('link to the relevant document')) {
                    linkColumnIndices.push(colIndex);
                    headerRowIndex = rowIndex;  // Track the header row index
                    console.log(`Found 'Link to the relevant document' in sheet "${sheetName}" at row ${rowIndex + 1}, column ${colIndex + 1}`);
                }
            });

            // Stop once we find the header row
            if (linkColumnIndices.length > 0) break;
        }

        // If no "Link to the relevant document" columns were found, mark the sheet as incomplete
        if (linkColumnIndices.length === 0) {
            console.warn(`Sheet "${sheetName}" does not contain any "Link to the relevant document" columns.`);
            allSheetsComplete = false;
            return;
        }

        // Check rows below the header to ensure all link columns are complete
        let sheetComplete = true;
        for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
            const row = data[rowIndex];

            // Skip rows that are completely empty
            if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

            // Check all "Link to the relevant document" columns for valid links
            for (let colIndex of linkColumnIndices) {
                const cellValue = row[colIndex]?.toString().trim();
                const isLink = cellValue && (cellValue.startsWith('http://') || cellValue.startsWith('https://'));

                // If any link is missing or invalid, mark the sheet as incomplete
                if (!isLink) {
                    console.warn(`Invalid or missing link in sheet "${sheetName}" at row ${rowIndex + 1}, column ${colIndex + 1}: ${cellValue}`);
                    sheetComplete = false;
                    break;  // Exit the loop for this row once an invalid link is found
                }
            }

            // If the sheet is incomplete, break out of the loop
            if (!sheetComplete) break;
        }

        // If this sheet is incomplete, mark the workbook as incomplete
        if (!sheetComplete) {
            console.log(`Sheet "${sheetName}" is incomplete.`);
            allSheetsComplete = false;
        } else {
            console.log(`Sheet "${sheetName}" is complete.`);
        }
    });

    // Update the submit button based on whether all sheets are complete
    updateSubmitButton(allSheetsComplete);
}


// Function to update the submit button state
function updateSubmitButton(isComplete) {
    const submitButton = document.getElementById('submitButton');
    submitButton.style.display = 'block'; 

    if (isComplete) {
        submitButton.disabled = false; 
        submitButton.style.backgroundColor = 'green'; 
        submitButton.style.color = 'white';
        submitButton.textContent = 'Ready to Submit';
    } else {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = 'gray'; 
        submitButton.style.color = 'black';
        submitButton.textContent = 'Incomplete';
    }
}
let collectedLinks = [];
// Function to collect all links (irrespective of Google Drive or not) from the sheets
function collectAllLinks() {
    // Retrieve campus and branch from session storage
    collectedLinks = [];
    const campus = sessionStorage.getItem('campus');
    const branch = sessionStorage.getItem('branch');  // Assuming branch is stored during login
    const criteriaNumber = sessionStorage.getItem('criteriaNumber');

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Iterate over rows in the sheet to find any links (http:// or https://)
        data.forEach(row => {
            row.forEach(cell => {
                const cellValue = (cell || '').toString().trim();
                const isLink = cellValue.startsWith('http://') || cellValue.startsWith('https://');

                if (isLink) {
                    // Add the link to the collectedLinks array with metadata
                    collectedLinks.push({
                        campus: campus,
                        branch: branch,
                        criteria: criteriaNumber,
                        subCriteria: sheetName,
                        link: cellValue
                    });
                }
            });
        });
    });

    console.log("Collected All Links:", collectedLinks);  // For debugging
}

// Sync data changes with Handsontable and recheck completion
function syncDataAndCheckCompletion() {
    // Update the workbook's data based on Handsontable changes
    const updatedData = handsontableInstance.getData();
    const sheetName = document.getElementById('sheetDropdown').value;
    const worksheet = XLSX.utils.aoa_to_sheet(updatedData);
    workbook.Sheets[sheetName] = worksheet;

    // Re-run the completion check with updated data
    checkCompletion();
}

// Initial setup to call checkCompletion when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateSubmitButton(false); 
    if (workbook) {
        checkCompletion();
    }
});

// Save changes made to the table
function saveChanges() {
    alert('Changes saved!'); // Optionally add more logic here to confirm changes are saved
}

// Download the updated Excel file
function downloadUpdatedExcel() {
    const updatedData = handsontableInstance.getData(); // Get the updated data from Handsontable
    const worksheet = XLSX.utils.aoa_to_sheet(updatedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Use XLSX to write and trigger download
    XLSX.writeFile(workbook, 'Updated_Template.xlsx');
}

document.getElementById('submitButton').addEventListener('click', function(event) {
    event.preventDefault();  // Prevent the default button action

    console.log("Button clicked, event triggered");

    collectAllLinks();  // Collect links if needed

    console.log("Sending fetch request...");

    fetch('http://localhost:5000/download-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            collectedLinks: collectedLinks,  // The collected links array
        }),
    })
    .then(response => {
        console.log("Response received:", response);
        if (!response.ok) {
            throw new Error('Network response was not ok');  // Handle non-200 responses
        }
        return response.json();
    })
    .then(data => {
        console.log("Success data:", data);
        alert('Files are being downloaded to the server.');
    })
    .catch((error) => {
        console.error('Fetch error occurred:', error);
        alert('An error occurred. Check the console for more details.');
    });

    console.log("End of function, fetch request sent...");
});
