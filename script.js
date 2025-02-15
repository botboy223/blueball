function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

// Initialize jsPDF
window.jsPDF = window.jspdf.jsPDF;

// Data Storage
let productDetails = JSON.parse(localStorage.getItem('productDetails')) || {};
let cart = [];
let upiDetails = JSON.parse(localStorage.getItem('upiDetails')) || {};
let billHistory = JSON.parse(localStorage.getItem('billHistory')) || [];

// Scanner Instances
let html5QrcodeScannerOption1, html5QrcodeScannerOption2;

domReady(function () {
    // Initialize Scanners
    html5QrcodeScannerOption1 = new Html5QrcodeScanner(
        "my-qr-reader-option1",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );

    html5QrcodeScannerOption2 = new Html5QrcodeScanner(
        "my-qr-reader-option2",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );

    // Product Setup Scanner
    html5QrcodeScannerOption1.render((decodeText) => {
        handleBarcodeScan(decodeText, 'option1');
    });

    // Cart Scanner
    html5QrcodeScannerOption2.render((decodeText) => {
        handleBarcodeScan(decodeText, 'option2');
    });

    // Initialize UI
    updateInventoryDisplay();
    updateDashboard();
});

function handleBarcodeScan(decodeText, scannerType) {
    if (scannerType === 'option1') {
        document.getElementById('barcode').value = decodeText;
        if (productDetails[decodeText]) {
            document.getElementById('product-name').value = productDetails[decodeText].name;
            document.getElementById('product-price').value = productDetails[decodeText].price;
        } else {
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
        }
    } else if (scannerType === 'option2') {
        if (productDetails[decodeText]) {
            const existingItem = cart.find(item => item.code === decodeText);
            if (!existingItem) {
                cart.push({ code: decodeText, quantity: 1 });
                displayCart();
            }
        } else {
            alert(`Product ${decodeText} not found!`);
        }
    }
}

// Inventory Management Functions
function updateInventoryDisplay() {
    const tbody = document.getElementById('inventoryList');
    tbody.innerHTML = '';
    
    Object.entries(productDetails).forEach(([barcode, product]) => {
        const row = document.createElement('tr');
        row.dataset.barcode = barcode;
        row.innerHTML = `
            <td>${barcode}</td>
            <td><input type="text" value="${product.name}"></td>
            <td><input type="number" value="${product.price}" step="0.01"></td>
            <td><input type="number" value="${product.quantity}"></td>
            <td>
                <button class="save-btn">Save</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateDashboard() {
    const today = new Date().toLocaleDateString();
    const todaySales = billHistory
        .filter(bill => new Date(bill.date).toLocaleDateString() === today)
        .reduce((sum, bill) => sum + parseFloat(bill.total), 0);
    
    const totalSales = billHistory
        .reduce((sum, bill) => sum + parseFloat(bill.total), 0);
    
    const lowStock = Object.entries(productDetails)
        .filter(([_, p]) => p.quantity < p.threshold)
        .map(([b, p]) => `${p.name} (${p.quantity})`);

    document.getElementById('todaySales').textContent = `Rs. ${todaySales.toFixed(2)}`;
    document.getElementById('totalSales').textContent = `Rs. ${totalSales.toFixed(2)}`;
    document.getElementById('lowStockList').textContent = lowStock.join(', ') || 'No low stock items';
}

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

// Event Listeners
document.getElementById('cart').addEventListener('input', (e) => {
    if (e.target.classList.contains('quantity-input')) {
        const index = e.target.dataset.index;
        const newQty = parseInt(e.target.value);
        if (!isNaN(newQty) {
            cart[index].quantity = newQty > 0 ? newQty : 1;
            displayCart();
        }
    }
});

document.getElementById('save-barcode').addEventListener('click', () => {
    const barcode = document.getElementById('barcode').value.trim();
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const quantity = parseInt(prompt("Initial stock quantity:", "10")) || 0;

    if (barcode && name && !isNaN(price) && price > 0 && quantity >= 0) {
        productDetails[barcode] = { 
            name, 
            price,
            quantity,
            threshold: 5
        };
        localStorage.setItem('productDetails', JSON.stringify(productDetails));
        updateInventoryDisplay();
        updateDashboard();
        alert('Product saved!');
    } else {
        alert('Invalid input!');
    }
});

document.getElementById('inventoryList').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;

    const barcode = row.dataset.barcode;
    const product = productDetails[barcode];

    if (e.target.classList.contains('save-btn')) {
        const inputs = row.querySelectorAll('input');
        productDetails[barcode] = {
            name: inputs[0].value,
            price: parseFloat(inputs[1].value),
            quantity: parseInt(inputs[2].value),
            threshold: product.threshold
        };
        localStorage.setItem('productDetails', JSON.stringify(productDetails));
        updateDashboard();
    }

    if (e.target.classList.contains('delete-btn')) {
        if (confirm("Delete this product permanently?")) {
            delete productDetails[barcode];
            localStorage.setItem('productDetails', JSON.stringify(productDetails));
            updateInventoryDisplay();
            updateDashboard();
        }
    }
});

// Bill Generation
document.getElementById('generate-bill').addEventListener('click', async () => {
    try {
        if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
            throw new Error('Please configure UPI details first');
        }

        const totalAmount = cart.reduce((sum, item) => {
            const product = productDetails[item.code];
            return sum + (product?.price || 0) * item.quantity;
        }, 0);

        // Update inventory
        cart.forEach(item => {
            if (productDetails[item.code]) {
                productDetails[item.code].quantity = Math.max(
                    0,
                    productDetails[item.code].quantity - item.quantity
                );
            }
        });
        localStorage.setItem('productDetails', JSON.stringify(productDetails));

        // Generate PDF (existing implementation)
        // ... [keep existing PDF generation code] ...

        // Update sales history
        billHistory.push({
            date: new Date().toLocaleString(),
            total: totalAmount.toFixed(2),
            items: [...cart]
        });
        localStorage.setItem('billHistory', JSON.stringify(billHistory));

        // Clear cart and update UI
        cart = [];
        displayCart();
        updateInventoryDisplay();
        updateDashboard();

    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error(error);
    }
});

// Navigation Functions
function switchToOption1() {
    hideAllOptions();
    document.getElementById('option1').style.display = 'block';
}

function switchToOption2() {
    hideAllOptions();
    document.getElementById('option2').style.display = 'block';
}

function switchToOption6() {
    hideAllOptions();
    document.getElementById('option6').style.display = 'block';
    updateInventoryDisplay();
    updateDashboard();
}

function hideAllOptions() {
    document.querySelectorAll('.option').forEach(option => {
        option.style.display = 'none';
    });
}

// UPI Form Handler
document.getElementById('qrForm').addEventListener('submit', (e) => {
    e.preventDefault();
    upiDetails = {
        upiId: document.getElementById('upi_id').value.trim(),
        name: document.getElementById('name').value.trim(),
        note: document.getElementById('note').value.trim()
    };
    localStorage.setItem('upiDetails', JSON.stringify(upiDetails));
    alert('UPI details saved!');
});

// Import/Export Handlers
document.getElementById('download-data').addEventListener('click', () => {
    const data = {
        productDetails,
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
                upiDetails = data.upiDetails || {};
                billHistory = data.billHistory || [];
                localStorage.setItem('productDetails', JSON.stringify(productDetails));
                localStorage.setItem('upiDetails', JSON.stringify(upiDetails));
                localStorage.setItem('billHistory', JSON.stringify(billHistory));
                updateInventoryDisplay();
                updateDashboard();
                alert('Data imported!');
            } catch (error) {
                alert('Invalid file format!');
            }
        };
        reader.readAsText(file);
    }
});
