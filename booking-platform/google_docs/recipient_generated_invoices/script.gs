/* eslint-disable */
/*
This script is intended for use in Google Docs Script Editor.

NOTE: Previously this used Rhino JS which only supported ECMAScript 5 + a few extas. As of 18 Feb 2020 I've
switched over to use V8 engine. If you deploy this anywhere you MUST set it to use V8 instead.

To use this script:
1. Ensure you have the spreadsheet you want to use as the Recipient Generated Invoices spreadsheet open
2. Ensure you have the Google Docs ID of the Template - Recipient Generated Invoice document
    (it's in the URL just after '/d/')
3. Ensure you have the Google Docs ID of the folder the invoices should be saved to
    (it's in the URL just after '/folders/')
4. Open the script editor on the spreadsheet, copy the contents of this file to the editor, then save
5. Adjust docID in generateRGIDocuments to match the template ID
6. Adjust destinationID in generateRGIDocuments to match the invoice folder ID
7. Get the ID of the Recipient Generated Invoices spreadsheet - obtained the same way as for the Template document
8. Update GOOGLE_SHEETS_RGI_ID in django-root/django_site/settings/<env>.py with the ID of the Recipient Generated
    Invoices document
 */

function onOpen() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var menuEntries = [];
    menuEntries.push({ name: 'Generate Data for Reports', functionName: 'generateReportData' });
    menuEntries.push({ name: 'Generate SC Driver Invoices', functionName: 'generateRGIDocuments' });
    menuEntries.push({ name: 'Show Data', functionName: 'SCFunction3' });
    ss.addMenu('Southern Cross Menu', menuEntries);
}

function SCFunction3() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    var dataRange = sheet.getRange(1, 1, lastRow, lastCol).getValues();

    Logger.log(dataRange);

    return dataRange;
}

/**
 * Range that writes to a cached values on a VirtualSheet.
 *
 * This is an optimisation - allows us to write code against normal Range API (or limited version of it)
 * and then write out the values in one hit (see VirtualSheet.write).
 *
 * This was necessary as we hit timeout on script run time otherwise.
 */
class VirtualRange {
    constructor(virtualSheet, row1, col1, row2, col2) {
        this.virtualSheet = virtualSheet;
        this.row1 = Number(row1);
        this.row2 = Number(row2);
        this.col1 = Number(col1);
        this.col2 = Number(col2);
    }

    getValue() {
        return this.virtualSheet.values[this.row1 - 1][this.col1 - 1];
    }
    getDisplayValue() {
        return this.virtualSheet.displayValues[this.row1 - 1][this.col1 - 1];
    }

    getValues() {
        const fromRow = this.row1 - 1;
        const fromCol = this.col1 - 1;
        return this.virtualSheet.values
            .slice(fromRow, this.row2 + 1)
            .map(row => row.slice(fromCol, this.col2 + 1));
    }

    setValue(value) {
        const rowIndex = this.row1 - 1;
        while (rowIndex >= this.virtualSheet.values.length) {
            this.virtualSheet.values.push(new Array(this.virtualSheet.values[0].length).fill(''));
        }
        this.virtualSheet.values[this.row1 - 1][this.col1 - 1] = value;
    }
}

/**
 * Wrapper around a sheet that allows us to read values once and write values as a batch.
 *
 * This is an optimisation and only the bare minimum in terms of methods are implemented.
 *
 * This was necessary as we hit timeout on script run time otherwise.
 */
class VirtualSheet {
    constructor(sheet) {
        this.sheet = sheet;
        const range = sheet.getDataRange();
        this.values = range.getValues();
        this.displayValues = range.getDisplayValues();
    }

    getRange(row1, col1, row2 = null, col2 = null) {
        if (row2 == null) {
            row2 = row1;
        }
        if (col2 == null) {
            col2 = col1;
        }
        return new VirtualRange(this, row1, col1, row2, col2);
    }

    write() {
        this.sheet.clear();
        this.values.forEach(row => {
            this.sheet.appendRow(row);
        });
    }
}

function generateReportData() {
    // Get the relevant sheets from the current spreadsheet
    var activeDocument = SpreadsheetApp.getActiveSpreadsheet();
    var initSheet = activeDocument.getSheetByName('Driver Earnings Summary');
    var newSheet = activeDocument.getSheetByName('Invoice Data');
    // If the 'Invoice Data' sheet exists, destroy and recreate it
    if (newSheet != null) {
        activeDocument.deleteSheet(newSheet);
    }
    newSheet = activeDocument.insertSheet();
    newSheet.setName('Invoice Data');

    const initSheetV = new VirtualSheet(initSheet);
    // Figure out the maximum number of drivers allocated to any given car
    var initRowCount = initSheet.getLastRow() - 1;
    // Get data from column A (index 1) - exclude header in row 1
    var rawInvoiceGroups = initSheetV.getRange(2, 1, initRowCount, 1).getValues();
    var invoiceGroups = {};
    rawInvoiceGroups.forEach(function(row, rowIndex) {
        if (invoiceGroups[row[0]]) {
            invoiceGroups[row[0]].push(rowIndex + 2);
        } else {
            invoiceGroups[row[0]] = [rowIndex + 2];
        }
    });
    var maxDrivers = Math.max.apply(
        0,
        Object.keys(invoiceGroups).map(function(key) {
            return invoiceGroups[key].length;
        })
    );

    // Set the headers on the destination sheet
    var initHeaders = [
        'Email',
        'Name',
        'Status',
        'Fleet Number',
        'Car Rego',
        'ABN',
        'Period',
        'Date of Pay',
    ];
    // Set headers in A1:H1
    newSheet.getRange(1, 1, 1, 8).setValues([initHeaders]);
    for (var driverNum = 1; driverNum <= maxDrivers; driverNum++) {
        var driverHeaders = [
            'Driver ' + driverNum,
            'Name ' + driverNum,
            'Driver Count ' + driverNum,
            'Driver Pay ' + driverNum,
            'Earnings ' + driverNum,
            'OOP ' + driverNum,
            'Vouchers ' + driverNum,
            'PayPal ' + driverNum,
            'Other Additions ' + driverNum,
            'Driver Collect ' + driverNum,
            'Advance ' + driverNum,
            'Bonus ' + driverNum,
        ];
        // Set driver headers after existing headers (I1:T1 for driver 1, U1:AF1 for driver2, etc.)
        newSheet.getRange(1, 9 + 12 * (driverNum - 1), 1, 12).setValues([driverHeaders]);
    }
    var finalHeaders = [
        'Total Earnings',
        'Running Total 1',
        'Depot Fee',
        'Service Fee',
        'Service Fee Pct',
        'Marketing Fee',
        'Marketing Fee Pct',
        'Booking Fee',
        'Booking Fee Count',
        'Total Fees',
        'Running Total 2',
        'Total Other',
        'Running Total 3',
        'Fuel',
        'eTag',
        'Other',
        'Franchise Fee',
        'Total Costs',
        'Running Total 4',
        'Balance',
        'Account Name',
        'BSB',
        'Account Number',
    ];
    // Set final headers starting with column index 9 + 12 * maxDrivers (allows 8 initial headers
    // and 12 headers per driver per invoice group) and extending 23 columns
    newSheet.getRange(1, 9 + 12 * maxDrivers, 1, 23).setValues([finalHeaders]);

    const newSheetV = new VirtualSheet(newSheet);

    /*
    Column mappings for fixed data between source and destination sheets
    1  14  Email
    2   4  Invoicing Party Name
    3   6  Invoicing Party Type (Status)
    4   5  Invoicing Party Number (Fleet Number)
    5   3  Car Rego
    6   7  ABN
    7   8  Period
    8  10  Date of Pay
    */
    const fixedColumnMappings = { 1: 14, 2: 4, 3: 6, 4: 5, 5: 3, 6: 7, 7: 8, 8: 10 };
    /*
    Column mappings for per-driver data between source and destination sheets
    1  22  Driver Number (Driver)
    2  23  Driver Name
    3  32  Booking Count (Driver Count)
    5  26  Total Earnings (Earnings)
    6  34  OOP
    7  35  Vouchers
    8  36  Paypal
    9  37  Other Additions
    10  39  Driver Collect
    11  40  Advance
    12  25  Bonus
    */
    const driverColumnMappings = {
        1: 22,
        2: 23,
        3: 32,
        5: 26,
        6: 34,
        7: 35,
        8: 36,
        9: 37,
        10: 39,
        11: 40,
        12: 25,
    };
    /*
    Column mappings for single row final columns (remember to add driver column offset to key)
    5  28  Service Fee Percent
    7  30  Marketing Fee Percent
    21  11  Account Name
    22  12  BSB
    23  13  Account Number
    */
    const finalFixedMappings = { 5: 28, 7: 30, 21: 11, 22: 12, 23: 13 };
    /*
    Column mappings for negative single row final columns (remember to add driver column offset to key)
    14  18  Fuel
    15  19  E-Tag
    16  20  Other
    17  16  Franchise Fee
    */
    const finalNegativeFixedMappings = { 14: 18, 15: 19, 16: 20, 17: 16 };
    /*
    Column mappings for sum final columns (remember to add driver column offset to key)
    1  26  Total Earnings
    9  32  Booking Count
    12  38  Total Additions (Other Additions)
    */
    const finalSumMappings = { 1: 26, 9: 32, 12: 38 };
    /*
    Column mappings for negative sum final columns (remember to add driver column offset to key)
    4  27  Service Fee
    6  29  Marketing Fee
    8  31  Booking Fee
    */
    const finalNegativeSumMappings = { 4: 27, 6: 29, 8: 31 };
    // Keep track of which invoice groups we've handled and which row we're writing to
    var handledInvoiceGroups = [];
    // Start at row 2 - row 1 is headers
    var newRow = 2;
    // Populate the data on the destination sheet
    for (var currentRow = 2; currentRow <= initRowCount + 1; currentRow++) {
        var invoiceGroup = initSheetV.getRange(currentRow, 1).getValue();
        if (handledInvoiceGroups.indexOf(invoiceGroup) !== -1) {
            // Don't write out an invoice group twice
            continue;
        }
        handledInvoiceGroups.push(invoiceGroup);
        for (var key in fixedColumnMappings) {
            newSheetV
                .getRange(newRow, key)
                .setValue(
                    initSheetV.getRange(currentRow, fixedColumnMappings[key]).getDisplayValue()
                );
        }
        for (var targetDriverNum in invoiceGroups[invoiceGroup]) {
            // Get the source row for this driver
            var sourceDriverRowNum = invoiceGroups[invoiceGroup][targetDriverNum];
            // Fill in the copied values
            for (var key in driverColumnMappings) {
                var newColumnIndex = 8 + 12 * Number(targetDriverNum) + Number(key);
                newSheetV
                    .getRange(newRow, newColumnIndex)
                    .setValue(
                        initSheetV
                            .getRange(sourceDriverRowNum, driverColumnMappings[key])
                            .getValue()
                    );
            }
            // Handle column 4 (Driver Pay / Earnings per Booking) separately - it's a computed value, not a copied value
            var earnings = initSheetV.getRange(sourceDriverRowNum, 26).getValue();
            var bookingCount = initSheetV.getRange(sourceDriverRowNum, 32).getValue();
            newSheetV
                .getRange(newRow, 8 + 12 * Number(targetDriverNum) + 4)
                .setValue(
                    bookingCount == 0 ? 0 : Math.round((earnings * 100) / bookingCount) / 100
                );
        }
        var finalOffset = 8 + 12 * maxDrivers;
        // Handle the single row final columns (use this row for their values)
        for (var key in finalFixedMappings) {
            newSheetV
                .getRange(newRow, finalOffset + Number(key))
                .setValue(initSheetV.getRange(currentRow, finalFixedMappings[key]).getValue());
        }
        for (var key in finalNegativeFixedMappings) {
            newSheetV
                .getRange(newRow, finalOffset + Number(key))
                .setValue(
                    -initSheetV.getRange(currentRow, finalNegativeFixedMappings[key]).getValue()
                );
        }
        if (!invoiceGroups[invoiceGroup]) {
            var a = 15;
        }
        // Handle the sum final columns, summing across all rows for this invoice group for the values
        for (var key in finalSumMappings) {
            newValue = invoiceGroups[invoiceGroup].reduce(function(result, rowIndex) {
                return (
                    result + Number(initSheetV.getRange(rowIndex, finalSumMappings[key]).getValue())
                );
            }, 0);
            newSheetV.getRange(newRow, finalOffset + Number(key)).setValue(newValue);
        }

        for (var key in finalNegativeSumMappings) {
            newValue = invoiceGroups[invoiceGroup].reduce(function(result, rowIndex) {
                return (
                    result -
                    Number(initSheetV.getRange(rowIndex, finalNegativeSumMappings[key]).getValue())
                );
            }, 0);
            newSheetV.getRange(newRow, finalOffset + Number(key)).setValue(newValue);
        }
        // Handle remaining final rows
        newSheetV
            .getRange(newRow, finalOffset + 2)
            .setValue(newSheetV.getRange(newRow, finalOffset + 1).getValue()); // Running Total 1
        newSheetV
            .getRange(newRow, finalOffset + 3)
            .setValue(-initSheetV.getRange(sourceDriverRowNum, 15).getValue()); // Depot fee (negated here)
        var feeTotal =
            invoiceGroups[invoiceGroup].reduce(function(result, rowIndex) {
                return result - Number(initSheetV.getRange(rowIndex, 33).getValue());
            }, 0) + newSheetV.getRange(newRow, finalOffset + 3).getValue();
        newSheetV.getRange(newRow, finalOffset + 10).setValue(feeTotal); // Total fees (negated here and also includes the depot fee)
        newSheetV
            .getRange(newRow, finalOffset + 11)
            .setValue(
                newSheetV.getRange(newRow, finalOffset + 2).getValue() +
                    newSheetV.getRange(newRow, finalOffset + 10).getValue()
            ); // Running Total 2
        newSheetV
            .getRange(newRow, finalOffset + 13)
            .setValue(
                newSheetV.getRange(newRow, finalOffset + 11).getValue() +
                    newSheetV.getRange(newRow, finalOffset + 12).getValue()
            ); // Running Total 3
        var costTotal =
            newSheetV
                .getRange(newRow, finalOffset + 14, newRow, 4)
                .getValues()[0]
                .reduce(function(result, value) {
                    return result + Number(value);
                }, 0) +
            invoiceGroups[invoiceGroup].reduce(function(result, rowIndex) {
                return result - Number(initSheetV.getRange(rowIndex, 40).getValue());
            }, 0);
        newSheetV.getRange(newRow, finalOffset + 18).setValue(costTotal); // Total Costs
        newSheetV
            .getRange(newRow, finalOffset + 19)
            .setValue(
                newSheetV.getRange(newRow, finalOffset + 13).getValue() +
                    newSheetV.getRange(newRow, finalOffset + 18).getValue()
            ); // Running Total 4
        newSheetV
            .getRange(newRow, finalOffset + 20)
            .setValue(newSheetV.getRange(newRow, finalOffset + 19).getValue()); // Balance
        newRow += 1;
    }

    newSheetV.write();
    // Inform the user that the data has been transferred
    var ui = SpreadsheetApp.getUi();
    ui.alert('Data transfer complete.');
}

function replaceTag(document, rawTag, value) {
    var tag = '{{' + rawTag + '}}';
    while (document.findText(tag) != null) {
        document.replaceText(tag, value);
    }
}

function formatCurrency(amount) {
    if (typeof amount != 'number') {
        Logger.log('Invalid amount', amount, typeof amount);
        return amount;
    }
    if (amount < 0) {
        return Utilities.formatString('-$%.2f', -amount);
    }
    return Utilities.formatString('$%.2f', amount);
}

function getAncestorOfType(element, type) {
    if (element.getType() === type) {
        return element;
    }
    var result = element.getParent();
    while ([type, DocumentApp.ElementType.BODY_SECTION].indexOf(result.getType()) === -1) {
        result = result.getParent();
    }
    return result.getType() === type ? result : null;
}

function mergeObjects() {
    var result = {};
    for (var i = 0; i < arguments.length; i++) {
        for (key in arguments[i]) {
            result[key] = arguments[i][key];
        }
    }
    return result;
}

function replaceTemplateRows(params) {
    // Get appropriate attribute objects for later assignment to corresponding cells
    var rightIndent = {};
    rightIndent[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = DocumentApp.HorizontalAlignment.RIGHT;
    var driverCellAttributes = params.invoiceTable.getCell(2, 0).getAttributes();
    var labelCellAttributes = params.invoiceTable.getCell(2, 1).getAttributes();
    var amountCellAttributes = params.invoiceTable.getCell(2, 2).getAttributes();
    driverCellAttributes[DocumentApp.Attribute.BACKGROUND_COLOR] = null;
    labelCellAttributes[DocumentApp.Attribute.BACKGROUND_COLOR] = null;
    amountCellAttributes[DocumentApp.Attribute.BACKGROUND_COLOR] = null;

    // Populate the first row for the given field - replacing existing text
    var baseCell = getAncestorOfType(
        params.body.findText('{{' + params.tag + '}}').getElement(),
        DocumentApp.ElementType.TABLE_CELL
    );
    baseCell.getPreviousSibling().setText(params.driverNumber);
    baseCell
        .getPreviousSibling()
        .getChild(0)
        .setAttributes(rightIndent);
    var labelText =
        'labelFunction' in params ? params.labelFunction(params.rowNumber, 0) : params.label;
    baseCell.setText(labelText);
    baseCell
        .getNextSibling()
        .setText(
            formatCurrency(
                params.invoiceSheet.getRange(params.rowNumber, params.dataColumnIndex).getValue()
            )
        );
    baseCell
        .getNextSibling()
        .getChild(0)
        .setAttributes(rightIndent);

    // Populate the subsequent rows by generating new rows
    var earningsRowIndex = params.invoiceTable.getChildIndex(baseCell.getParent());
    for (var driverNum = 1; driverNum < params.numDrivers; driverNum++) {
        var newRow = params.invoiceTable.insertTableRow(earningsRowIndex + driverNum);
        var newDriverCell = newRow.appendTableCell(
            params.invoiceSheet.getRange(params.rowNumber, 9 + 12 * driverNum).getDisplayValue()
        );
        newDriverCell.setAttributes(driverCellAttributes);
        // Right-align works on the paragraph within the cell, not the cell itself
        newDriverCell.getChild(0).setAttributes(rightIndent);
        var labelText =
            'labelFunction' in params
                ? params.labelFunction(params.rowNumber, driverNum)
                : params.label;
        var newLabelCell = newRow.appendTableCell(labelText);
        newLabelCell.setAttributes(labelCellAttributes);
        var newAmountCell = newRow.appendTableCell(
            formatCurrency(
                params.invoiceSheet
                    .getRange(params.rowNumber, params.dataColumnIndex + 12 * driverNum)
                    .getValue()
            )
        );
        newAmountCell.setAttributes(amountCellAttributes);
        // Right-align works on the paragraph within the cell, not the cell itself
        newAmountCell.getChild(0).setAttributes(rightIndent);
    }
}

function generateRGIDocuments() {
    // Get the invoice spreadsheet
    var activeDocument = SpreadsheetApp.getActiveSpreadsheet();
    var invoiceSheet = activeDocument.getSheetByName('Invoice Data');
    var numColumns = invoiceSheet.getLastColumn();
    var maxDriverCount = (numColumns - 31) / 12;

    const invoiceSheetV = new VirtualSheet(invoiceSheet);

    // Get the source template
    var docID = '1KYDEuzavEM1f7MeSfA01r5P77GIBHqKaAJh7JROBA3k';
    var doc = DocumentApp.openById(docID);

    // Get the destination folder
    var destinationID = '1GX7zYc6o16IXXmfBSSIxjF5Kxi_6tuYe';
    var destinationFolder = DriveApp.getFolderById(destinationID);

    for (var rowNumber = 2; rowNumber <= invoiceSheet.getLastRow(); rowNumber++) {
        // Copy template to folder with appropriate name
        var fileName = 'RGI_' + rowNumber;
        var newRGI = DriveApp.getFileById(docID).makeCopy(fileName, destinationFolder);
        var newDocID = newRGI.getId();
        // Open newly created document
        var newDoc = DocumentApp.openById(newDocID);
        var body = newDoc.getBody();
        var invoiceTable = body.getTables()[2];

        // Populate template based on initial columns
        for (var columnNumber = 1; columnNumber <= 8; columnNumber++) {
            replaceTag(
                body,
                invoiceSheetV.getRange(1, columnNumber).getValue(),
                invoiceSheetV.getRange(rowNumber, columnNumber).getDisplayValue()
            );
        }
        // Populate template based on final columns
        for (var columnNumber = numColumns - 22; columnNumber <= numColumns - 3; columnNumber++) {
            var displayValue = invoiceSheetV.getRange(rowNumber, columnNumber).getValue();
            // Format as currency UNLESS column is Service Fee Pct (18th from end), Marketing Fee Pct (16th from end), or Booking Fee Count (14th from end)
            if ([14, 16, 18].indexOf(numColumns - columnNumber) === -1) {
                displayValue = formatCurrency(displayValue);
            }
            replaceTag(body, invoiceSheetV.getRange(1, columnNumber).getValue(), displayValue);
        }
        for (var columnNumber = numColumns - 2; columnNumber <= numColumns; columnNumber++) {
            replaceTag(
                body,
                invoiceSheetV.getRange(1, columnNumber).getValue(),
                invoiceSheetV.getRange(rowNumber, columnNumber).getDisplayValue()
            );
        }

        // Get the number of drivers on this invoice
        var driverIds = [];
        for (var driverNum = 0; driverNum < maxDriverCount; driverNum++) {
            value = invoiceSheetV.getRange(rowNumber, 9 + 12 * driverNum).getValue();
            if (value !== '') {
                driverIds.push(value);
            }
        }
        var numDrivers = driverIds.length;

        // Generate and populate the per-driver rows
        var driverNumber = invoiceSheetV.getRange(rowNumber, 9).getDisplayValue();

        // Basic parameters for replaceTemplateRows
        var baseParams = {
            body: body,
            rowNumber: rowNumber,
            driverNumber: driverNumber,
            invoiceSheet: invoiceSheetV,
            invoiceTable: invoiceTable,
            numDrivers: numDrivers,
        };

        replaceTemplateRows(
            mergeObjects(baseParams, {
                tag: 'Earnings',
                dataColumnIndex: 13,
                labelFunction: function(rowNumber, driverNumber) {
                    return (
                        'Earnings - ' +
                        invoiceSheetV.getRange(rowNumber, 11 + driverNumber * 12).getDisplayValue() +
                        ' @ ' +
                        formatCurrency(
                            invoiceSheetV.getRange(rowNumber, 12 + driverNumber * 12).getValue()
                        )
                    );
                },
            })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, { tag: 'Bonuses', dataColumnIndex: 20, label: 'Bonuses' })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, { tag: 'OOP', dataColumnIndex: 14, label: 'OOP' })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, { tag: 'Vouchers', dataColumnIndex: 15, label: 'Vouchers' })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, { tag: 'PayPal', dataColumnIndex: 16, label: 'PayPal' })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, {
                tag: 'Other Additions',
                dataColumnIndex: 17,
                label: 'Other Additions',
            })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, {
                tag: 'Driver Collect',
                dataColumnIndex: 18,
                label: 'Driver Collect',
            })
        );
        replaceTemplateRows(
            mergeObjects(baseParams, {
                tag: 'Advance Payment',
                dataColumnIndex: 19,
                label: 'Advance Payment',
            })
        );

        newDoc.saveAndClose();

        var emailTo = invoiceSheetV.getRange(rowNumber, 1).getDisplayValue();
        var message = 'Please see attached Tax Invoice';
        var subject =
            'Southern Cross Tax Invoice for Period ' +
            invoiceSheetV.getRange(rowNumber, 7).getDisplayValue();

        var pdf = newDoc.getAs('application/pdf').getBytes();
        var attach = { fileName: 'Tax Invoice.pdf', content: pdf, mimeType: 'application/pdf' };
        MailApp.sendEmail(emailTo, subject, message, { attachments: [attach] });
    }
}
