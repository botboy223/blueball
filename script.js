<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>QR Code Scanner / Reader</title>
    <style>
        /* ... (keep existing styles the same) ... */
        
        /* New Inventory Styles */
        #inventory-list {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        #inventory-list th, #inventory-list td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        #inventory-list input {
            width: 80px;
            padding: 3px;
        }
        .dashboard-stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            flex: 1;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>QR Code Scanner</h1>
        <div class="button-group">
            <button id="moreButton" onclick="showMoreOptions()">More</button>
        </div>

        <div id="moreOptions" class="hidden">
            <button id="option1-button" onclick="switchToOption1()">Set Barcode Values</button>
            <button id="option3-button" onclick="switchToOption3()">UPI QR Code</button>
            <button id="option4-button" onclick="switchToOption4()">Import/Export Data</button>
            <button id="option5-button" onclick="switchToOption5()">Bill History</button>
            <!-- New Inventory and Dashboard Options -->
            <button id="option6-button" onclick="switchToOption6()">Inventory</button>
            <button id="option7-button" onclick="switchToOption7()">Dashboard</button>
            <button id="openDialogBtn">Download File</button>
            <button id="homePageBtn" onclick="window.location.href='https://qrwale.in/'">Home Page</button>
        </div>

        <!-- Existing Options (1-5) remain unchanged -->

        <!-- New Inventory Management Section -->
        <div id="option6" class="option hidden">
            <h2>Inventory Management</h2>
            <table id="inventory-list">
                <thead>
                    <tr>
                        <th>Barcode</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Low Stock Limit</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Inventory items will be populated by JavaScript -->
                </tbody>
            </table>
        </div>

        <!-- New Dashboard Section -->
        <div id="option7" class="option hidden">
            <h2>Sales Dashboard</h2>
            <div class="dashboard-stats">
                <div class="stat-card">
                    <h3>Total Sales</h3>
                    <p id="total-sales">Rs. 0.00</p>
                </div>
                <div class="stat-card">
                    <h3>Today's Sales</h3>
                    <p id="today-sales">Rs. 0.00</p>
                </div>
            </div>
            <div class="low-stock">
                <h3>Low Stock Alerts</h3>
                <ul id="low-stock-items"></ul>
            </div>
        </div>

        <!-- Updated Product Setup Form -->
        <div id="option1" class="option hidden">
            <div id="my-qr-reader-option1"></div>
            <div class="input-group">
                <label for="barcode">Barcode:</label>
                <input type="text" id="barcode" readonly>
            </div>
            <div class="input-group">
                <label for="product-name">Product Name:</label>
                <input type="text" id="product-name">
            </div>
            <div class="input-group">
                <label for="product-price">Product Price:</label>
                <input type="number" id="product-price">
            </div>
            <!-- New Inventory Fields -->
            <div class="input-group">
                <label for="product-quantity">Initial Quantity:</label>
                <input type="number" id="product-quantity" value="0">
            </div>
            <div class="input-group">
                <label for="low-limit">Low Stock Alert:</label>
                <input type="number" id="low-limit" value="5">
            </div>
            <button id="save-barcode">Save</button>
        </div>

        <!-- ... (rest of existing HTML remains the same) ... -->

    </div>

    <!-- ... (existing dialog box remains same) ... -->

    <script>
        // Update switch functions
        function switchToOption6() {
            hideAllOptions();
            document.getElementById('option6').style.display = 'block';
        }

        function switchToOption7() {
            hideAllOptions();
            document.getElementById('option7').style.display = 'block';
        }

        // Update hideAllOptions
        function hideAllOptions() {
            document.getElementById('option1').style.display = 'none';
            document.getElementById('option2').style.display = 'none';
            document.getElementById('option3').style.display = 'none';
            document.getElementById('option4').style.display = 'none';
            document.getElementById('option5').style.display = 'none';
            document.getElementById('option6').style.display = 'none';
            document.getElementById('option7').style.display = 'none';
        }

        // ... (rest of existing script remains the same) ...
    </script>
</body>
</html>
