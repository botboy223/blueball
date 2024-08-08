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

function switchToOption5() {
    document.getElementById('option1').style.display = 'none';
    document.getElementById('option2').style.display = 'none';
    document.getElementById('option3').style.display = 'none';
    document.getElementById('option4').style.display = 'none';
    document.getElementById('option5').style.display = 'block';
    displayBillHistory();
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
            productDetails[barcode] = {
                name: productName,
                price: productPrice
            };
            saveToLocalStorage('productDetails', productDetails);
            alert('Product saved successfully');
        } else {
            alert('Please fill in all fields correctly.');
        }
    });

    document.getElementById('generate-bill').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        const totalAmount = cart.reduce((sum, item) => {
            return sum + productDetails[item.code].price * item.quantity;
        }, 0);

        const upiUrl = `upi://pay?pa=${upiDetails.upi_id}&pn=${upiDetails.name}&tn=${upiDetails.note}&am=${totalAmount}&cu=INR`;

        const billId = Date.now().toString();
        const billDate = new Date().toLocaleString();
        billHistory.push({ billId, billDate, totalAmount, upiUrl, cart: [...cart] });
        saveToLocalStorage('billHistory', billHistory);

        const qrCode = new QRCodeStyling({
            width: 150,
            height: 150,
            data: upiUrl,
            dotsOptions: {
                color: "#000",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#fff",
            }
        });

        qrCode.append(document.getElementById('bill-qr-code'));

        alert('Bill generated successfully');
        cart = [];
        displayCart();
    });

    document.getElementById('qrForm').addEventListener('submit', function (event) {
        event.preventDefault();
        upiDetails = {
            upi_id: document.getElementById('upi_id').value,
            name: document.getElementById('name').value,
            note: document.getElementById('note').value,
        };
        saveToLocalStorage('upiDetails', upiDetails);
        alert('UPI details saved successfully');
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            billHistory,
            upiDetails,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('upload-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = JSON.parse(e.target.result);
                productDetails = data.productDetails || {};
                billHistory = data.billHistory || [];
                upiDetails = data.upiDetails || {};

                saveToLocalStorage('productDetails', productDetails);
                saveToLocalStorage('billHistory', billHistory);
                saveToLocalStorage('upiDetails', upiDetails);

                alert('Data imported successfully');
            };
            reader.readAsText(file);
        }
    });

    function displayBillHistory() {
    const billHistoryDiv = document.getElementById('bill-history');
    billHistoryDiv.innerHTML = '';

    billHistory.forEach((bill, index) => {
        const billDiv = document.createElement('div');
        
        // Create a list of products in the bill
        let productList = '';
        bill.cart.forEach(item => {
            const product = productDetails[item.code];
            if (product) {
                productList += `<li>${product.name} - ₹${product.price} x ${item.quantity}</li>`;
            } else {
                productList += `<li>Unknown Product - Code: ${item.code}</li>`;
            }
        });

        billDiv.innerHTML = `
            <div>
                <strong>Bill ID:</strong> ${bill.billId}<br>
                <strong>Date:</strong> ${bill.billDate}<br>
                <strong>Total Amount:</strong> ₹${bill.totalAmount}<br>
                <strong>Products:</strong>
                <ul>${productList}</ul>
            </div>
            <div id="bill-qr-code-${bill.billId}"></div>
            <button onclick="deleteBill(${index})">Delete Bill</button>
        `;
        billHistoryDiv.appendChild(billDiv);

        const qrCode = new QRCodeStyling({
            width: 150,
            height: 150,
            data: bill.upiUrl,
            dotsOptions: {
                color: "#000",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#fff",
            }
        });

        qrCode.append(document.getElementById(`bill-qr-code-${bill.billId}`));
    });
}


    function deleteBill(index) {
        billHistory.splice(index, 1);
        saveToLocalStorage('billHistory', billHistory);
        displayBillHistory();
    }

    const html5QrCodeOption1 = new Html5Qrcode("my-qr-reader-option1");
    const html5QrCodeOption2 = new Html5Qrcode("my-qr-reader-option2");

    html5QrCodeOption1.start(
        { facingMode: "environment" },
        {
            fps: 10,    // Optional, frame per seconds for qr code scanning
            qrbox: 250  // Optional, if you want bounded box UI
        },
        onScanSuccessOption1
    );

    html5QrCodeOption2.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        onScanSuccessOption2
    );

    // Load bill history when switching to option 5
    switchToOption5();
});
