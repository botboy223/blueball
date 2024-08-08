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

function switchToOption5() { // New function to switch to Bill History
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'block';

    displayBillHistory(); // Display the bill history when switching to this option
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};

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
            productDetails[barcode] = {
                name: productName,
                price: productPrice
            };

            saveToLocalStorage('productDetails', productDetails);
            alert('Product saved!');
        } else {
            alert('Please enter valid product details.');
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
            dotsOptions: { color: "#000", type: "rounded" },
            backgroundOptions: { color: "#fff" }
        });

        document.getElementById('bill-qr-code').innerHTML = "";
        qrCode.append(document.getElementById('bill-qr-code'));

        const bill = {
            id: `BILL${Date.now()}`,
            time: new Date().toLocaleString(),
            items: cart.map(item => ({
                code: item.code,
                name: productDetails[item.code].name,
                price: productDetails[item.code].price,
                quantity: item.quantity
            })),
            totalAmount
        };

        let billHistory = loadFromLocalStorage('billHistory') || [];
        billHistory.push(bill);
        saveToLocalStorage('billHistory', billHistory);

        alert('Total Bill: ₹' + totalAmount);
    });

    function displayBillHistory() { // New function to display Bill History
        const billHistory = loadFromLocalStorage('billHistory') || [];
        const historyDiv = document.getElementById('bill-history');
        historyDiv.innerHTML = '';

        if (billHistory.length === 0) {
            historyDiv.innerHTML = '<p>No bills found.</p>';
            return;
        }

        billHistory.forEach(bill => {
            const billDiv = document.createElement('div');
            billDiv.classList.add('bill-entry');
            billDiv.innerHTML = `
                <h3>Bill ID: ${bill.id}</h3>
                <p>Date: ${bill.time}</p>
                <p>Total: ₹${bill.totalAmount}</p>
                <ul>
                    ${bill.items.map(item => `<li>${item.name} (x${item.quantity}) - ₹${item.price}</li>`).join('')}
                </ul>
            `;
            historyDiv.appendChild(billDiv);
        });
    }

    const html5QrCodeOption1 = new Html5Qrcode("my-qr-reader-option1");
    const html5QrCodeOption2 = new Html5Qrcode("my-qr-reader-option2");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCodeOption1.start(
        { facingMode: "environment" },
        config,
        onScanSuccessOption1
    ).catch(err => console.error("QR code scanning failed.", err));

    html5QrCodeOption2.start(
        { facingMode: "environment" },
        config,
        onScanSuccessOption2
    ).catch(err => console.error("QR code scanning failed.", err));

    document.getElementById('qrForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const upiId = document.getElementById('upi_id').value;
        const name = document.getElementById('name').value;
        const note = document.getElementById('note').value;

        if (upiId && name && note) {
            upiDetails = { upiId, name, note };
            saveToLocalStorage('upiDetails', upiDetails);
            alert('UPI details saved!');
        } else {
            alert('Please fill in all fields.');
        }
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = JSON.stringify(productDetails);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_data.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('upload-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    productDetails = jsonData;
                    saveToLocalStorage('productDetails', productDetails);
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Failed to import data: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });
});
