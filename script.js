function domReady(fn) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
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
    document.getElementById('option1').style.display = 'block';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
}

function switchToOption2() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'block';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
}

function switchToOption3() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'block';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'none';
}

function switchToOption4() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'block';
    document.getElementById('option5').style.display = 'none';
}

function switchToOption5() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'block';
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];

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
            alert('Product details saved.');
        } else {
            alert('Please fill in all fields.');
        }
    });

    // Save bill to history and local storage
    function saveBillToHistory(billData) {
        billHistory.push(billData);
        saveToLocalStorage('billHistory', billHistory);
        displayBillHistory();
    }

    // Display bill history
    function displayBillHistory() {
        const historyDiv = document.getElementById('bill-history');
        historyDiv.innerHTML = '';

        if (billHistory.length === 0) {
            historyDiv.innerHTML = '<p>No bills found.</p>';
            return;
        }

        billHistory.forEach((bill, index) => {
            const billDiv = document.createElement('div');
            billDiv.innerHTML = `
                <p>Bill ${index + 1} - Date: ${bill.date}, Time: ${bill.time}</p>
                <div>QR Code: <img src="${bill.qrCode}" alt="QR Code"></div>
                <div>Products:</div>
                <ul>
                    ${bill.items.map(item => `
                        <li>${item.name} - Price: ₹${item.price}, Quantity: ${item.quantity}</li>
                    `).join('')}
                </ul>
                <p>Total: ₹${bill.total}</p>
                <button onclick="deleteBill(${index})">Delete Bill</button>
            `;
            historyDiv.appendChild(billDiv);
        });
    }

    // Delete bill from history
    window.deleteBill = function(index) {
        if (confirm('Are you sure you want to delete this bill?')) {
            billHistory.splice(index, 1);
            saveToLocalStorage('billHistory', billHistory);
            displayBillHistory();
        }
    }

    // Generate Bill (Existing function with enhancements)
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

        // Create QR code image as base64 string
        qrCode.getRawData('jpeg').then((qrCodeData) => {
            const billData = {
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                items: cart.map(item => ({
                    name: productDetails[item.code].name,
                    price: productDetails[item.code].price,
                    quantity: item.quantity
                })),
                total: totalAmount,
                qrCode: URL.createObjectURL(new Blob([qrCodeData], { type: 'image/jpeg' }))
            };

            saveBillToHistory(billData);

            document.getElementById('bill-qr-code').innerHTML = "";
            qrCode.append(document.getElementById('bill-qr-code'));

            alert('Total Bill: ₹' + totalAmount);
        });
    });

    // Initialize display of bill history
    displayBillHistory();

    // Add new option button to view bill history
    document.getElementById('moreOptions').innerHTML += `
        <button id="option5-button" onclick="switchToOption5()">View Bill History</button>
    `;

    // Save UPI Details
    document.getElementById('save-upi-details').addEventListener('click', () => {
        upiDetails = {
            upiId: document.getElementById('upi-id').value,
            name: document.getElementById('upi-name').value,
            note: document.getElementById('upi-note').value
        };
        saveToLocalStorage('upiDetails', upiDetails);
        alert('UPI details saved.');
    });

    // Initialize QR Scanners for both options
    new Html5QrcodeScanner("reader-option1", { fps: 10, qrbox: 250 }).render(onScanSuccessOption1);
    new Html5QrcodeScanner("reader-option2", { fps: 10, qrbox: 250 }).render(onScanSuccessOption2);

    // General QR Scanner (if needed)
    function onScanSuccess(decodeText, decodeResult) {
        alert("Your QR is: " + decodeText, decodeResult);
    }

    let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbox: 250 });
    htmlscanner.render(onScanSuccess);
});
