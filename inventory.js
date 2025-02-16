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

    // Scanner for Option 1 (Product Setup)
    const html5QrcodeScannerOption1 = new Html5QrcodeScanner(
        "my-qr-reader-option1",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScannerOption1.render((decodeText) => {
        const barcodeEl = document.getElementById('barcode');
        if (barcodeEl) {
            barcodeEl.value = decodeText;
            if (productDetails[decodeText]) {
                const nameEl = document.getElementById('product-name');
                const priceEl = document.getElementById('product-price');
                const quantityEl = document.getElementById('product-quantity');
                if (nameEl && priceEl && quantityEl) {
                    nameEl.value = productDetails[decodeText].name;
                    priceEl.value = productDetails[decodeText].price;
                    quantityEl.value = inventory[decodeText]?.quantity || 0;
                }
            } else {
                const nameEl = document.getElementById('product-name');
                const priceEl = document.getElementById('product-price');
                const quantityEl = document.getElementById('product-quantity');
                if (nameEl && priceEl && quantityEl) {
                    nameEl.value = '';
                    priceEl.value = '';
                    quantityEl.value = '';
                }
            }
        }
    });

    // Scanner for Option 2 (Cart)
    const html5QrcodeScannerOption2 = new Html5QrcodeScanner(
        "my-qr-reader-option2",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScannerOption2.render((decodeText) => {
        if (productDetails[decodeText]) {
            const existingItem = cart.find(item => item.code === decodeText);
            if (!existingItem) {
                if (inventory[decodeText].quantity > 0) { // Check if there's stock
                    cart.push({ code: decodeText, quantity: 1 }); // Start with a quantity of 1
                    displayCart();
                } else {
                    alert(`Out of stock for product ${inventory[decodeText].name}!`);
                }
            } else {
                if (inventory[decodeText].quantity >= existingItem.quantity + 1) { // Check if adding more won't exceed stock
                    existingItem.quantity++;
                    displayCart();
                } else {
                    alert(`Cannot add more. Only ${inventory[decodeText].quantity} left in stock for ${inventory[decodeText].name}.`);
                }
            }
        } else {
            alert(`Product ${decodeText} not found!`);
        }
    });

    // Cart Display
    function displayCart() {
        const cartDiv = document.getElementById('cart');
        if (cartDiv) {
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
        } else {
            console.error('Element with id "cart" not found');
        }
    }

    function calculateTotal() {
        const totalEl = document.getElementById('total');
        if (totalEl) {
            const total = cart.reduce((sum, item) => {
                const product = productDetails[item.code];
                return sum + (product?.price || 0) * item.quantity;
            }, 0);
            totalEl.innerHTML = `<strong>Total:</strong> Rs. ${total.toFixed(2)}`;
        } else {
            console.error('Element with id "total" not found');
        }
    }

    // Event Listeners
    const cartContainer = document.getElementById('cart');
    if (cartContainer) {
        cartContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const index = e.target.dataset.index;
                const newQty = parseInt(e.target.value);
                const productCode = cart[index].code;
                const oldQty = cart[index].quantity;
                
                if (!isNaN(newQty) && newQty > 0) {
                    // Check if there's enough stock before changing quantity
                    if (inventory[productCode].quantity >= newQty) {
                        cart[index].quantity = newQty;
                        displayCart();
                    } else {
                        alert(`Not enough stock. Only ${inventory[productCode].quantity} left.`);
                        e.target.value = oldQty; // Reset to previous value
                    }
                } else if (e.target.value === '') {
                    // Allow the field to be empty temporarily for editing
                    e.target.value = ''; // Keep it empty so user can type a new number
                } else {
                    // If input is not a positive number or empty, reset to old quantity
                    alert('Quantity must be a positive number.');
                    e.target.value = oldQty; // Reset to previous value
                }
            }
        });
    } else {
        console.error('Element with id "cart" not found for adding event listeners');
    }

    const saveBarcodeButton = document.getElementById('save-barcode');
    if (saveBarcodeButton) {
        saveBarcodeButton.addEventListener('click', () => {
            const barcode = document.getElementById('barcode')?.value.trim() || '';
            const name = document.getElementById('product-name')?.value.trim() || '';
            const price = parseFloat(document.getElementById('product-price')?.value) || NaN;
            const quantity = parseInt(document.getElementById('product-quantity')?.value) || 0;

            if (barcode && name && !isNaN(price) && price > 0) {
                productDetails[barcode] = { name, price };
                inventory[barcode] = { name, price, quantity };
                saveToLocalStorage('productDetails', productDetails);
                saveToLocalStorage('inventory', inventory);
                alert('Product saved successfully!');
            } else {
                alert('Invalid input! Please check all fields.');
            }
        });
    } else {
        console.error('Element with id "save-barcode" not found');
    }

    // PDF Generation
    const generateBillButton = document.getElementById('generate-bill');
    if (generateBillButton) {
        generateBillButton.addEventListener('click', async () => {
            try {
                // Validate UPI details
                if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
                    throw new Error('Please configure UPI details first');
                }

                // Calculate total
                const totalAmount = cart.reduce((sum, item) => {
                    const product = productDetails[item.code];
                    return sum + (product?.price || 0) * item.quantity;
                }, 0);

                // Generate UPI URL
                const upiUrl = `upi://pay?pa=${upiDetails.upiId}` +
                                `&pn=${encodeURIComponent(upiDetails.name)}` +
                                `&am=${totalAmount.toFixed(2)}` +
                                `&cu=INR` +
                                `&tn=${encodeURIComponent(upiDetails.note)}`;

                // Create QR Code
                const qrCode = new QRCodeStyling({
                    width: 200,
                    height: 200,
                    data: upiUrl,
                    dotsOptions: {
                        color: "#000",
                        type: "rounded"
                    },
                    backgroundOptions: {
                        color: "#ffffff"
                    }
                });

                // Render QR Code
                const qrContainer = document.getElementById('bill-qr-code');
                if (qrContainer) {
                    qrContainer.innerHTML = '';
                    qrCode.append(qrContainer);
                } else {
                    console.error('Element with id "bill-qr-code" not found');
                }

                // Wait for QR code rendering
                await new Promise(resolve => setTimeout(resolve, 500));

                // Create PDF
                const doc = new jsPDF();
                let yPos = 20;

                // Header
                doc.setFontSize(22);
                doc.text("INVOICE", 105, yPos, { align: 'center' });
                yPos += 15;

                // Invoice Details
                doc.setFontSize(12);
                doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
                doc.text(`Time: ${new Date().toLocaleTimeString()}`, 160, yPos);
                yPos += 15;

                // Table Header
                doc.setFillColor(240, 240, 240);
                doc.rect(20, yPos, 170, 10, 'F');
                doc.setFontSize(12);
                doc.text("Item", 22, yPos + 7);
                doc.text("Qty", 100, yPos + 7);
                doc.text("Price", 160, yPos + 7);
                yPos += 12;

                // Items
                cart.forEach(item => {
                    const product = productDetails[item.code];
                    doc.setFontSize(10);
                    doc.text(product?.name || 'Unknown Item', 22, yPos);
                    doc.text(item.quantity.toString(), 102, yPos);
                    doc.text(`Rs. ${(product?.price * item.quantity).toFixed(2)}`, 162, yPos);
                    yPos += 8;
                });

                // Total
                yPos += 10;
                doc.setFontSize(14);
                doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 20, yPos);

                // Add QR Code
                const qrCanvas = qrContainer?.querySelector('canvas');
                if (qrCanvas) {
                    const qrData = qrCanvas.toDataURL('image/png');
                    doc.addImage(qrData, 'PNG', 140, yPos - 10, 50, 50);
                }

                // Save to history
                billHistory.push({
                    date: new Date().toLocaleString(),
                    total: totalAmount.toFixed(2),
                    items: [...cart]
                });
                saveToLocalStorage('billHistory', billHistory);

                // Update inventory and save changes after bill generation
                cart.forEach(item => {
                    updateInventory(item.code, item.quantity);
                });
                
                // Clear cart
                cart = [];
                displayCart();
                
                // Update dashboard data including today's sales
                updateDashboard();

                // Open PDF
                const pdfBlob = doc.output('blob');
                window.open(URL.createObjectURL(pdfBlob), '_blank');

            } catch (error) {
                alert(`Error: ${error.message}`);
                console.error(error);
            }
        });
    } else {
        console.error('Element with id "generate-bill" not found');
    }

    // UPI Form Handler
    const qrForm = document.getElementById('qrForm');
    if (qrForm) {
        qrForm.addEventListener('submit', (e) => {
            e.preventDefault();
            upiDetails = {
                upiId: document.getElementById('upi_id')?.value.trim() || '',
                name: document.getElementById('name')?.value.trim() || '',
                note: document.getElementById('note')?.value.trim() || ''
            };
            saveToLocalStorage('upiDetails', upiDetails);
            alert('UPI details saved!');
        });
    } else {
        console.error('Element with id "qrForm" not found');
    }

    // Import/Export Handlers
    const downloadDataButton = document.getElementById('download-data');
    if (downloadDataButton) {
        downloadDataButton.addEventListener('click', () => {
            const data = {
                productDetails,
                upiDetails,
                billHistory,
                inventory
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
    } else {
        console.error('Element with id "download-data" not found');
    }

    const uploadDataInput = document.getElementById('upload-data');
    if (uploadDataInput) {
        uploadDataInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        productDetails = data.productDetails || {};
                        upiDetails = data.upiDetails || {};
                        billHistory = data.billHistory || {};
                        inventory = data.inventory || {};
                        saveToLocalStorage('productDetails', productDetails);
                        saveToLocalStorage('upiDetails', upiDetails);
                        saveToLocalStorage('billHistory', billHistory);
                        saveToLocalStorage('inventory', inventory);
                        alert('Data imported successfully!');
                    } catch (error) {
                        alert('Invalid file format!');
                    }
                };
                reader.readAsText(file);
            }
        });
    } else {
        console.error('Element with id "upload-data" not found');
    }

    // Bill History Display
    const option5Button = document.getElementById('option5-button');
    if (option5Button) {
        option5Button.addEventListener('click', () => {
            const historyContainer = document.getElementById('bill-history');
            if (historyContainer) {
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
            } else {
                console.error('Element with id "bill-history" not found');
            }
        });
    } else {
        console.error('Element with id "option5-button" not found');
    }

    // Inventory Management
    function updateInventory(barcode, quantityChange) {
        if (inventory[barcode]) {
            inventory[barcode].quantity -= quantityChange;
            if (inventory[barcode].quantity < 0) {
                inventory[barcode].quantity = 0; // Ensure no negative stock
            }
            saveToLocalStorage('inventory', inventory);
        }
    }

    function displayInventory() {
        const inventoryList = document.getElementById('inventory-list');
        if (inventoryList) {
            inventoryList.innerHTML = '';
            for (const [barcode, data] of Object.entries(inventory)) {
                const item = document.createElement('div');
                item.innerHTML = `
                    <span>${data.name}</span>
                    <span>Price: Rs. ${data.price.toFixed(2)}</span>
                    <span>Quantity: <input type="number" value="${data.quantity}" data-barcode="${barcode}" class="edit-quantity"></span>
                    <button data-barcode="${barcode}" class="edit-product">Edit</button>
                `;
                inventoryList.appendChild(item);
            }

            // Event listeners for editing quantity:
            document.querySelectorAll('.edit-quantity').forEach(input => {
                input.addEventListener('change', function() {
                    const barcode = this.getAttribute('data-barcode');
                    const newQuantity = parseInt(this.value);
                    if (newQuantity >= 0) { // Ensure quantity isn't negative
                        inventory[barcode].quantity = newQuantity;
                        const saveInventoryButton = document.getElementById('save-inventory');
                        if (saveInventoryButton) {
                            saveInventoryButton.style.display = 'block'; // Show save button
                        }
                    } else {
                        alert('Quantity cannot be negative!');
                        this.value = inventory[barcode].quantity; // Reset to previous value
                    }
                });
            });

            // Event listener for editing product details
            document.querySelectorAll('.edit-product').forEach(button => {
                button.addEventListener('click', function() {
                    const barcode = this.getAttribute('data-barcode');
                    const product = inventory[barcode];
                    if (document.getElementById('barcode') && document.getElementById('product-name') && document.getElementById('product-price') && document.getElementById('product-quantity')) {
                        document.getElementById('barcode').value = barcode;
                        document.getElementById('product-name').value = product.name;
                        document.getElementById('product-price').value = product.price;
                        document.getElementById('product-quantity').value = product.quantity;
                        switchToOption1(); // Switch to Set Barcode Values to allow editing
                        const saveInventoryButton = document.getElementById('save-inventory');
                        if (saveInventoryButton) {
                            saveInventoryButton.style.display = 'block'; // Show save button
                        }
                    }
                });
            });

            // Save button event listener
            const saveInventoryButton = document.getElementById('save-inventory');
            if (saveInventoryButton) {
                saveInventoryButton.addEventListener('click', function() {
                    saveToLocalStorage('inventory', inventory);
                    this.style.display = 'none'; // Hide save button after saving
                    alert('Inventory saved!');
                    switchToInventory(); // Refresh inventory view
                });
            }
        } else {
            console.error('Element with id "inventory-list" not found');
        }
    }

    function updateDashboard() {
        const today = new Date().toDateString();
        let todaySales = 0;
        let totalSales = 0;

        billHistory.forEach(bill => {
            totalSales += parseFloat(bill.total);
            if (new Date(bill.date).toDateString() === today) {
                todaySales += parseFloat(bill.total);
            }
        });

        // Debugging: Check if elements exist
        console.log('Checking for elements:', 
            document.getElementById('today-sales'), 
            document.getElementById('total-sales'), 
            document.getElementById('low-stock-items')
        );

        const todaySalesEl = document.getElementById('today-sales');
        if (todaySalesEl) {
            todaySalesEl.textContent = todaySales.toFixed(2);
        } else {
            console.error('Element with id "today-sales" not found');
        }

        const totalSalesEl = document.getElementById('total-sales');
        if (totalSalesEl) {
            totalSalesEl.textContent = totalSales.toFixed(2);
        } else {
            console.error('Element with id "total-sales" not found');
        }

        const lowStockList = document.getElementById('low-stock-items');
        if (lowStockList) {
            lowStockList.innerHTML = '';
            Object.entries(inventory).filter(([_, item]) => item.quantity <= 5).forEach(([barcode, item]) => {
                const li = document.createElement('li');
                li.textContent = `${item.name} (${item.quantity} left)`;
                lowStockList.appendChild(li);
            });
        } else {
            console.error('Element with id "low-stock-items" not found');
        }
    }

    // Show/Hide Options
    function showMoreOptions() {
        console.log("More button clicked!");
        const moreOptions = document.getElementById('moreOptions');
        if (moreOptions) {
            moreOptions.classList.toggle('hidden');
            updateDashboard();
        } else {
            console.error('Element with id "moreOptions" not found');
        }
    }

    function switchToOption1() {
        hideAllOptions();
        const option1 = document.getElementById('option1');
        if (option1) {
            option1.style.display = 'block';
        } else {
            console.error('Element with id "option1" not found');
        }
    }

    function switchToOption2() {
        hideAllOptions();
        const option2 = document.getElementById('option2');
        if (option2) {
            option2.style.display = 'block';
        } else {
            console.error('Element with id "option2" not found');
        }
    }

    function switchToOption3() {
        hideAllOptions();
        const option3 = document.getElementById('option3');
        if (option3) {
            option3.style.display = 'block';
        } else {
            console.error('Element with id "option3" not found');
        }
    }

    function switchToOption4() {
        hideAllOptions();
        const option4 = document.getElementById('option4');
        if (option4) {
            option4.style.display = 'block';
        } else {
            console.error('Element with id "option4" not found');
        }
    }

    function switchToOption5() {
        hideAllOptions();
        const option5 = document.getElementById('option5');
        if (option5) {
            option5.style.display = 'block';
        } else {
            console.error('Element with id "option5" not found');
        }
    }

    function switchToInventory() {
        hideAllOptions();
        const inventoryOption = document.getElementById('inventory-option');
        if (inventoryOption) {
            inventoryOption.style.display = 'block';
            displayInventory();
        } else {
            console.error('Element with id "inventory-option" not found');
        }
    }

    function hideAllOptions() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
        } else {
            console.error('Element with id "dashboard" not found');
        }
    }

    // Event listeners for all buttons
    const moreButton = document.getElementById('moreButton');
    if (moreButton) {
        moreButton.removeEventListener('click', showMoreOptions); // Remove existing listener if any
        moreButton.addEventListener('click', showMoreOptions);
        moreButton.addEventListener('touchstart', showMoreOptions);
    } else {
        console.error('Element with id "moreButton" not found');
    }

    const option1Button = document.getElementById('option1-button');
    if (option1Button) {
        option1Button.addEventListener('click', switchToOption1);
    } else {
        console.error('Element with id "option1-button" not found');
    }

    const option2Button = document.getElementById('option2-button');
    if (option2Button) {
        option2Button.addEventListener('click', switchToOption2);
    } else {
        console.error('Element with id "option2-button" not found');
    }

    const option3Button = document.getElementById('option3-button');
    if (option3Button) {
        option3Button.addEventListener('click', switchToOption3);
    } else {
        console.error('Element with id "option3-button" not found');
    }

    const option4Button = document.getElementById('option4-button');
    if (option4Button) {
        option4Button.addEventListener('click', switchToOption4);
    } else {
        console.error('Element with id "option4-button" not found');
    }

    const option5Button = document.getElementById('option5-button');
    if (option5Button) {
        option5Button.addEventListener('click', switchToOption5);
    } else {
        console.error('Element with id "option5-button" not found');
    }

    const inventoryButton = document.getElementById('inventory-button');
    if (inventoryButton) {
        inventoryButton.addEventListener('click', switchToInventory);
    } else {
        console.error('Element with id "inventory-button" not found');
    }

    // Initial setup
    switchToOption2(); // Default to cart view
    updateDashboard();
});
