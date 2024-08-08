function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

function switchToOption1() {
    displaySection('option1');
}

function switchToOption2() {
    displaySection('option2');
}

function switchToOption3() {
    displaySection('option3');
}

function switchToOption4() {
    displaySection('option4');
}

function switchToOption5() {
    displaySection('option5');
    loadBillHistory();
}

function switchToOption6() {
    displaySection('option6');
    loadInventory();
}

function displaySection(sectionId) {
    const sections = document.querySelectorAll('.option');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];
    let inventory = loadFromLocalStorage('inventory') || {};

    function onScanSuccessOption1(decodeText, decodeResult) {
        document.getElementById('barcode').value = decodeText;
        if (productDetails[decodeText]) {
            document.getElementById('product-name').value = productDetails[decodeText].name;
            document.getElementById('product-price').value = productDetails[decodeText].price;
        } else {
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
        }
    }

    function onScanSuccessOption2(decodeText, decodeResult) {
        if (productDetails[decodeText]) {
            const product = productDetails[decodeText];
            const item = cart.find(item => item.code === decodeText);

            if (item) {
                item.quantity += 1;
            } else {
                cart.push({ code: decodeText, quantity: 1 });
            }

            displayCart();
        } else {
            alert("Unknown product: " + decodeText);
        }
    }

    function displayCart() {
        const cartDiv = document.getElementById('cart');
        cartDiv.innerHTML = '';

        cart.forEach((item, index) => {
            const product = productDetails[item.code];
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
                ${item.code} - ₹${product.price} - ${product.name} 
                Quantity: <input type="number" value="${item.quantity}" min="1" data-index="${index}">
            `;
            cartDiv.appendChild(itemDiv);
        });

        calculateTotal();
    }

    function calculateTotal() {
        let total = 0;

        cart.forEach(item => {
            const product = productDetails[item.code];
            total += product.price * item.quantity;
        });

        document.getElementById('total').innerText = `Total: ₹${total}`;
    }

    document.getElementById('cart').addEventListener('input', (event) => {
        const input = event.target;
        const index = input.dataset.index;
        const newQuantity = parseInt(input.value, 10);

        if (!isNaN(newQuantity) && newQuantity > 0) {
            cart[index].quantity = newQuantity;
            calculateTotal();
        }
    });

    document.getElementById('save-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode').value;
        const productName = document.getElementById('product-name').value;
        const productPrice = parseFloat(document.getElementById('product-price').value);

        if (barcode && productName && !isNaN(productPrice)) {
            productDetails[barcode] = { name: productName, price: productPrice };
            saveToLocalStorage('productDetails', productDetails);

            // Add to inventory
            inventory[barcode] = { name: productName, price: productPrice };
            saveToLocalStorage('inventory', inventory);

            alert('Product details saved.');
        } else {
            alert('Please fill in all fields.');
        }
    });

    document.getElementById('generate-bill').addEventListener('click', () => {
        const totalAmount = document.getElementById('total').innerText.split('₹')[1];

        if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
            alert('Please set up your UPI details in the UPI QR Code section first.');
            return;
        }

        const upiUrl = `upi://pay?pa=${upiDetails.upiId}&pn=${upiDetails.name}&am=${totalAmount}&cu=INR&tn=${upiDetails.note}`;

        const qrCode = new QRCodeStyling({
            width: 300,
            height: 300,
            data: upiUrl,
            dotsOptions: {
                color: "#000",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#fff",
            }
        });

        document.getElementById('bill-qr-code').innerHTML = "";
        qrCode.append(document.getElementById('bill-qr-code'));

        // Save the bill in history
        const bill = {
            id: Date.now(),
            amount: totalAmount,
            date: new Date().toLocaleString(),
            cart: [...cart]
        };
        billHistory.push(bill);
        saveToLocalStorage('billHistory', billHistory);

        alert('Total Bill: ₹' + totalAmount);
        cart = [];
        displayCart();
    });

    document.getElementById('qrForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const upiId = document.getElementById('upi_id').value;
        const name = document.getElementById('name').value;
        const note = document.getElementById('note').value;

        upiDetails = { upiId, name, note };
        saveToLocalStorage('upiDetails', upiDetails);

        alert('UPI details saved.');
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            cart,
            upiDetails,
            billHistory,
            inventory
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('upload-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = JSON.parse(e.target.result);
                if (data.productDetails) productDetails = data.productDetails;
                if (data.cart) cart = data.cart;
                if (data.upiDetails) upiDetails = data.upiDetails;
                if (data.billHistory) billHistory = data.billHistory;
                if (data.inventory) inventory = data.inventory;

                saveToLocalStorage('productDetails', productDetails);
                saveToLocalStorage('upiDetails', upiDetails);
                saveToLocalStorage('billHistory', billHistory);
                saveToLocalStorage('inventory', inventory);

                alert('Data imported successfully.');
            };
            reader.readAsText(file);
        }
    });

    function loadBillHistory() {
        const billHistoryDiv = document.getElementById('bill-history');
        billHistoryDiv.innerHTML = '';

        billHistory.forEach(bill => {
            const billDiv = document.createElement('div');
            billDiv.innerHTML = `
                <strong>Bill ID:</strong> ${bill.id}<br>
                <strong>Date:</strong> ${bill.date}<br>
                <strong>Total Amount:</strong> ₹${bill.amount}<br>
                <button onclick="deleteBill(${bill.id})">Delete</button>
                <hr>
            `;
            billHistoryDiv.appendChild(billDiv);
        });
    }

    function deleteBill(billId) {
        billHistory = billHistory.filter(bill => bill.id !== billId);
        saveToLocalStorage('billHistory', billHistory);
        loadBillHistory();
    }

    function loadInventory() {
        const inventoryListDiv = document.getElementById('inventory-list');
        inventoryListDiv.innerHTML = '';

        Object.keys(inventory).forEach(barcode => {
            const item = inventory[barcode];
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
                <strong>Barcode:</strong> ${barcode}<br>
                <strong>Name:</strong> ${item.name}<br>
                <strong>Price:</strong> ₹${item.price}<br>
                <button onclick="deleteInventoryItem('${barcode}')">Delete</button>
                <hr>
            `;
            inventoryListDiv.appendChild(itemDiv);
        });
    }

    function deleteInventoryItem(barcode) {
        delete inventory[barcode];
        saveToLocalStorage('inventory', inventory);
        loadInventory();
    }

    const qrReaderOption1 = new Html5Qrcode("my-qr-reader-option1");
    const qrReaderOption2 = new Html5Qrcode("my-qr-reader-option2");

    qrReaderOption1.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onScanSuccessOption1
    );

    qrReaderOption2.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onScanSuccessOption2
    );
});
