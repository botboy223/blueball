function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

window.jsPDF = window.jspdf.jsPDF;

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];
    let inventory = loadFromLocalStorage('inventory') || {};
    let dashboardData = loadFromLocalStorage('dashboardData') || {
        totalSales: 0,
        todaySales: 0,
        lowStockItems: []
    };

    // Product Setup Scanner
    const html5QrcodeScannerOption1 = new Html5QrcodeScanner(
        "my-qr-reader-option1",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScannerOption1.render((decodeText) => {
        document.getElementById('barcode').value = decodeText;
        if (productDetails[decodeText]) {
            document.getElementById('product-name').value = productDetails[decodeText].name;
            document.getElementById('product-price').value = productDetails[decodeText].price;
            document.getElementById('product-quantity').value = productDetails[decodeText].quantity;
            document.getElementById('low-limit').value = productDetails[decodeText].lowLimit;
        } else {
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
            document.getElementById('product-quantity').value = '';
            document.getElementById('low-limit').value = '5';
        }
    });

    // Cart Scanner
    const html5QrcodeScannerOption2 = new Html5QrcodeScanner(
        "my-qr-reader-option2",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScannerOption2.render((decodeText) => {
        if (productDetails[decodeText]) {
            const existingItem = cart.find(item => item.code === decodeText);
            if (!existingItem) {
                cart.push({ code: decodeText, quantity: 1 });
                displayCart();
            }
        } else {
            alert(`Product ${decodeText} not found!`);
        }
    });

    // Cart Functions
    function displayCart() {
        const cartDiv = document.getElementById('cart');
        cartDiv.innerHTML = '';
        cart.forEach((item, index) => {
            const product = productDetails[item.code];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <span class="product-name">${product?.name || 'Unknown Product'}</span>
                <span class="product-price">Rs. ${product?.price?.toFixed(2) || '0.00'}</span>
                <input type="number" 
                       value="${item.quantity}" 
                       min="1" 
                       data-index="${index}"
                       class="quantity-input">
                <span class="item-total">Rs. ${(product?.price * item.quantity).toFixed(2) || '0.00'}</span>
            `;
            cartDiv.appendChild(itemDiv);
        });
        calculateTotal();
    }

    function calculateTotal() {
        const total = cart.reduce((sum, item) => {
            const product = productDetails[item.code];
            return sum + (product?.price || 0) * item.quantity;
        }, 0);
        document.getElementById('total').innerHTML = `<strong>Total:</strong> Rs. ${total.toFixed(2)}`;
    }

    document.getElementById('cart').addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const index = e.target.dataset.index;
            const newQty = parseInt(e.target.value);
            if (!isNaN(newQty) && newQty > 0) {
                cart[index].quantity = newQty;
                displayCart();
            }
        }
    });

    // Product Setup
    document.getElementById('save-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode').value.trim();
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const quantity = parseInt(document.getElementById('product-quantity').value) || 0;
        const lowLimit = parseInt(document.getElementById('low-limit').value) || 5;

        if (barcode && name && !isNaN(price) && price > 0) {
            productDetails[barcode] = { 
                name, 
                price,
                quantity,
                lowLimit
            };
            saveToLocalStorage('productDetails', productDetails);
            updateInventory();
            alert('Product saved successfully!');
        } else {
            alert('Invalid input! Please check all fields.');
        }
    });

    // Inventory Management
    function updateInventory() {
        inventory = {};
        for (const [barcode, details] of Object.entries(productDetails)) {
            inventory[barcode] = { 
                name: details.name,
                price: details.price,
                quantity: details.quantity,
                lowLimit: details.lowLimit
            };
        }
        saveToLocalStorage('inventory', inventory);
        updateDashboard();
    }

    function updateStockAfterSale() {
        cart.forEach(item => {
            if (productDetails[item.code]) {
                productDetails[item.code].quantity -= item.quantity;
                productDetails[item.code].quantity = Math.max(productDetails[item.code].quantity, 0);
            }
        });
        saveToLocalStorage('productDetails', productDetails);
        updateInventory();
    }

    document.getElementById('option6-button').addEventListener('click', () => {
        const inventoryList = document.getElementById('inventory-list');
        inventoryList.innerHTML = '';
        
        for (const [barcode, item] of Object.entries(inventory)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${barcode}</td>
                <td><input type="text" value="${item.name}" data-field="name" data-barcode="${barcode}"></td>
                <td><input type="number" value="${item.quantity}" data-field="quantity" data-barcode="${barcode}"></td>
                <td><input type="number" step="0.01" value="${item.price}" data-field="price" data-barcode="${barcode}"></td>
                <td><input type="number" value="${item.lowLimit}" data-field="lowLimit" data-barcode="${barcode}"></td>
                <td><button class="save-inventory-btn" data-barcode="${barcode}">Save</button></td>
            `;
            inventoryList.appendChild(row);
        }
    });

    document.getElementById('inventory-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('save-inventory-btn')) {
            const barcode = e.target.dataset.barcode;
            const inputs = document.querySelectorAll(`[data-barcode="${barcode}"]`);
            
            inputs.forEach(input => {
                if (input.tagName === 'INPUT') {
                    const field = input.dataset.field;
                    const value = field === 'price' ? 
                        parseFloat(input.value) : 
                        parseInt(input.value);
                        
                    productDetails[barcode][field] = value;
                }
            });
            
            saveToLocalStorage('productDetails', productDetails);
            updateInventory();
            alert('Inventory updated!');
        }
    });

    // Dashboard Functions
    function getLowStockItems() {
        return Object.entries(productDetails)
            .filter(([_, item]) => item.quantity <= item.lowLimit)
            .map(([barcode, item]) => ({
                barcode,
                name: item.name,
                remaining: item.quantity,
                lowLimit: item.lowLimit
            }));
    }

    function updateDashboard() {
        const today = new Date().toLocaleDateString();
        const todaySales = billHistory
            .filter(bill => new Date(bill.date).toLocaleDateString() === today)
            .reduce((sum, bill) => sum + parseFloat(bill.total), 0);
        
        dashboardData.todaySales = todaySales;
        dashboardData.lowStockItems = getLowStockItems();
        
        document.getElementById('total-sales').textContent = dashboardData.totalSales.toFixed(2);
        document.getElementById('today-sales').textContent = todaySales.toFixed(2);
        
        const lowStockList = document.getElementById('low-stock-items');
        lowStockList.innerHTML = dashboardData.lowStockItems.map(item => `
            <li>${item.name} (Remaining: ${item.remaining}, Alert Limit: ${item.lowLimit})</li>
        `).join('');
    }

    // PDF Generation
    document.getElementById('generate-bill').addEventListener('click', async () => {
        try {
            if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
                throw new Error('Please configure UPI details first');
            }

            const totalAmount = cart.reduce((sum, item) => {
                const product = productDetails[item.code];
                return sum + (product?.price || 0) * item.quantity;
            }, 0);

            const upiUrl = `upi://pay?pa=${upiDetails.upiId}` +
                            `&pn=${encodeURIComponent(upiDetails.name)}` +
                            `&am=${totalAmount.toFixed(2)}` +
                            `&cu=INR` +
                            `&tn=${encodeURIComponent(upiDetails.note)}`;

            const qrCode = new QRCodeStyling({
                width: 200,
                height: 200,
                data: upiUrl,
                dotsOptions: { color: "#000", type: "rounded" },
                backgroundOptions: { color: "#ffffff" }
            });

            const qrContainer = document.getElementById('bill-qr-code');
            qrContainer.innerHTML = '';
            qrCode.append(qrContainer);

            await new Promise(resolve => setTimeout(resolve, 500));

            const doc = new jsPDF();
            let yPos = 20;

            doc.setFontSize(22);
            doc.text("INVOICE", 105, yPos, { align: 'center' });
            yPos += 15;

            doc.setFontSize(12);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
            doc.text(`Time: ${new Date().toLocaleTimeString()}`, 160, yPos);
            yPos += 15;

            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos, 170, 10, 'F');
            doc.setFontSize(12);
            doc.text("Item", 22, yPos + 7);
            doc.text("Qty", 100, yPos + 7);
            doc.text("Price", 160, yPos + 7);
            yPos += 12;

            cart.forEach(item => {
                const product = productDetails[item.code];
                doc.setFontSize(10);
                doc.text(product?.name || 'Unknown Item', 22, yPos);
                doc.text(item.quantity.toString(), 102, yPos);
                doc.text(`Rs. ${(product?.price * item.quantity).toFixed(2)}`, 162, yPos);
                yPos += 8;
            });

            yPos += 10;
            doc.setFontSize(14);
            doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 20, yPos);

            const qrCanvas = qrContainer.querySelector('canvas');
            if (qrCanvas) {
                const qrData = qrCanvas.toDataURL('image/png');
                doc.addImage(qrData, 'PNG', 140, yPos - 10, 50, 50);
            }

            billHistory.push({
                date: new Date().toLocaleString(),
                total: totalAmount.toFixed(2),
                items: [...cart]
            });
            saveToLocalStorage('billHistory', billHistory);

            dashboardData.totalSales += totalAmount;
            saveToLocalStorage('dashboardData', dashboardData);
            updateStockAfterSale();
            updateDashboard();

            const pdfBlob = doc.output('blob');
            window.open(URL.createObjectURL(pdfBlob), '_blank');

            cart = [];
            displayCart();

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        }
    });

    // UPI Form
    document.getElementById('qrForm').addEventListener('submit', (e) => {
        e.preventDefault();
        upiDetails = {
            upiId: document.getElementById('upi_id').value.trim(),
            name: document.getElementById('name').value.trim(),
            note: document.getElementById('note').value.trim()
        };
        saveToLocalStorage('upiDetails', upiDetails);
        alert('UPI details saved!');
    });

    // Import/Export
    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            upiDetails,
            billHistory,
            inventory,
            dashboardData
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qr-app-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    document.getElementById('upload-data').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    productDetails = data.productDetails || {};
                    upiDetails = data.upiDetails || {};
                    billHistory = data.billHistory || [];
                    inventory = data.inventory || {};
                    dashboardData = data.dashboardData || {
                        totalSales: 0,
                        todaySales: 0,
                        lowStockItems: []
                    };
                    saveToLocalStorage('productDetails', productDetails);
                    saveToLocalStorage('upiDetails', upiDetails);
                    saveToLocalStorage('billHistory', billHistory);
                    saveToLocalStorage('inventory', inventory);
                    saveToLocalStorage('dashboardData', dashboardData);
                    alert('Data imported successfully!');
                    updateDashboard();
                } catch (error) {
                    alert('Invalid file format!');
                }
            };
            reader.readAsText(file);
        }
    });

    // Bill History
    document.getElementById('option5-button').addEventListener('click', () => {
        const historyContainer = document.getElementById('bill-history');
        historyContainer.innerHTML = '';
        
        billHistory.forEach((bill, index) => {
            const billElement = document.createElement('div');
            billElement.className = 'bill-entry';
            billElement.innerHTML = `
                <h3>Bill #${index + 1}</h3>
                <p>Date: ${bill.date}</p>
                <ul>
                    ${bill.items.map(item => `
                        <li>${productDetails[item.code]?.name || 'Unknown'} 
                        (x${item.quantity}) - Rs. ${(productDetails[item.code]?.price * item.quantity).toFixed(2)}</li>
                    `).join('')}
                </ul>
                <p>Total: Rs. ${bill.total}</p>
                <hr>
            `;
            historyContainer.appendChild(billElement);
        });
    });

    // Initial Dashboard Update
    updateDashboard();
});
