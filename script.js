function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

window.jsPDF = window.jspdf.jsPDF;

// Storage functions
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let inventory = loadFromLocalStorage('inventory') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];
    let stockScanner = null;

    // Inventory Management Functions
    function updateInventoryUI() {
        const inventoryList = document.getElementById('inventory-list');
        inventoryList.innerHTML = '';
        
        Object.keys(productDetails).forEach(barcode => {
            const stock = inventory[barcode]?.stock || 0;
            const lowStock = inventory[barcode]?.lowStock || 'N/A';
            const status = stock <= lowStock ? '⚠️ Low Stock' : '✅ In Stock';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <span>${productDetails[barcode].name}</span>
                <span>Stock: ${stock}</span>
                <span>Low Stock Alert: ${lowStock}</span>
                <span>${status}</span>
            `;
            inventoryList.appendChild(itemDiv);
        });
    }

    function showAddStockForm() {
        document.getElementById('add-stock-form').classList.remove('hidden');
        
        // Clear previous scanner
        if (stockScanner) {
            stockScanner.clear().catch(console.error);
            document.getElementById('stock-scanner-container').innerHTML = '';
        }

        // Initialize new scanner
        stockScanner = new Html5QrcodeScanner(
            'stock-scanner-container',
            { fps: 30, qrbox: { width: 250, height: 250 } }
        );

        stockScanner.render((decodeText) => {
            document.getElementById('stock-barcode').value = decodeText;
            stockScanner.clear().catch(console.error);
        });
    }

    function updateStock() {
        const barcode = document.getElementById('stock-barcode').value;
        const quantity = parseInt(document.getElementById('stock-quantity').value);
        const lowStock = parseInt(document.getElementById('low-stock-alert').value);

        if (!productDetails[barcode]) {
            alert('Product not found!');
            return;
        }

        inventory[barcode] = {
            stock: quantity || inventory[barcode]?.stock || 0,
            lowStock: lowStock || inventory[barcode]?.lowStock || 5
        };

        saveToLocalStorage('inventory', inventory);
        updateInventoryUI();
        alert('Stock updated!');
        
        // Clear form
        document.getElementById('stock-barcode').value = '';
        document.getElementById('stock-quantity').value = '';
        document.getElementById('low-stock-alert').value = '';
        document.getElementById('add-stock-form').classList.add('hidden');
    }
            if (stockScanner) {
            stockScanner.clear().catch(error => console.error(error));
              document.getElementById('stock-scanner-container').innerHTML = '';
         }
      }

    // Cart Display
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

    // Event Listeners
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

    document.getElementById('save-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode').value.trim();
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);

        if (barcode && name && !isNaN(price) && price > 0) {
            productDetails[barcode] = { name, price };
            saveToLocalStorage('productDetails', productDetails);
            alert('Product saved!');
        } else {
            alert('Invalid input!');
        }
    });

    // PDF Generation
    document.getElementById('generate-bill').addEventListener('click', async () => {
        try {
            if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
                throw new Error('Configure UPI details first');
            }

            const totalAmount = cart.reduce((sum, item) => {
                const product = productDetails[item.code];
                return sum + (product?.price || 0) * item.quantity;
            }, 0);

            // Update inventory
            cart.forEach(item => {
                if (inventory[item.code]) {
                    inventory[item.code].stock -= item.quantity;
                    if (inventory[item.code].stock < 0) inventory[item.code].stock = 0;
                }
            });
            saveToLocalStorage('inventory', inventory);

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
            doc.text("Item", 22, yPos + 7);
            doc.text("Qty", 100, yPos + 7);
            doc.text("Price", 160, yPos + 7);
            yPos += 12;

            cart.forEach(item => {
                const product = productDetails[item.code];
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

            const pdfBlob = doc.output('blob');
            window.open(URL.createObjectURL(pdfBlob), '_blank');

            cart = [];
            displayCart();

        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // UPI Form Handler
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

    // Import/Export Handlers
    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            inventory,
            upiDetails,
            billHistory
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
                    inventory = data.inventory || {};
                    upiDetails = data.upiDetails || {};
                    billHistory = data.billHistory || [];
                    saveToLocalStorage('productDetails', productDetails);
                    saveToLocalStorage('inventory', inventory);
                    saveToLocalStorage('upiDetails', upiDetails);
                    saveToLocalStorage('billHistory', billHistory);
                    alert('Data imported!');
                } catch (error) {
                    alert('Invalid file!');
                }
            };
            reader.readAsText(file);
        }
    });

    // Bill History Display
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
});
