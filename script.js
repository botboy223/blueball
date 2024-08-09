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
            productDetails[barcode] = { name: productName, price: productPrice };
            saveToLocalStorage('productDetails', productDetails);
            alert('Product details saved.');
        } else {
            alert('Please fill in all fields correctly.');
        }
    });

    document.getElementById('qrForm').addEventListener('submit', (event) => {
        event.preventDefault();

        const upiId = document.getElementById('upi_id').value;
        const name = document.getElementById('name').value;
        const note = document.getElementById('note').value;

        if (upiId && name && note) {
            upiDetails = { upiId, name, note };
            saveToLocalStorage('upiDetails', upiDetails);
            alert('UPI details saved.');
        } else {
            alert('Please fill in all fields.');
        }
    });

    function saveBillToHistory(bill) {
        billHistory.push(bill);
        saveToLocalStorage('billHistory', billHistory);
    }

    function displayBillHistory() {
        const billHistoryDiv = document.getElementById('bill-history');
        billHistoryDiv.innerHTML = '';

        billHistory.forEach((bill, index) => {
            const billDiv = document.createElement('div');
            billDiv.innerHTML = `
                <p><strong>Date:</strong> ${bill.date}</p>
                <p><strong>Total:</strong> ₹${bill.total}</p>
                <p><strong>Products:</strong></p>
                <ul>
                    ${bill.products.map(product => `
                        <li>${product.name} - ₹${product.price} x ${product.quantity}</li>
                    `).join('')}
                </ul>
                <div id="qrCode-${index}"></div>
                <button onclick="deleteBill(${index})">Delete Bill</button>
                <hr>
            `;
            billHistoryDiv.appendChild(billDiv);

            const qrCode = new QRCodeStyling({
                width: 150,
                height: 150,
                data: bill.qrCodeUrl,
                dotsOptions: {
                    color: "#000",
                    type: "rounded"
                },
                backgroundOptions: {
                    color: "#fff",
                }
            });

            qrCode.append(document.getElementById(`qrCode-${index}`));
        });
    }

    function deleteBill(index) {
        billHistory.splice(index, 1);
        saveToLocalStorage('billHistory', billHistory);
        displayBillHistory();
    }

    document.getElementById('generate-bill').addEventListener('click', () => {
        const totalAmount = document.getElementById('total').innerText.split('₹')[1];

        if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
            alert('Please set up your UPI details in the UPI QR Code section first.');
            return;
        }

        const upiUrl = `upi://pay?pa=${upiDetails.upiId}&pn=${upiDetails.name}&am=${totalAmount}&cu=INR&tn=${upiDetails.note}`;

        const bill = {
            date: new Date().toLocaleString(),
            total: totalAmount,
            products: cart.map(item => ({
                code: item.code,
                name: productDetails[item.code].name,
                price: productDetails[item.code].price,
                quantity: item.quantity
            })),
            qrCodeUrl: upiUrl
        };

        saveBillToHistory(bill);

        cart = [];
        document.getElementById('cart').innerHTML = '';
        document.getElementById('total').innerText = 'Total: ₹0';

        displayBillHistory();

        switchToOption5();
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            billHistory,
            upiDetails
        };
        const dataStr = JSON.stringify(data);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'data.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    document.getElementById('upload-data').addEventListener('change', function () {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            const importedData = JSON.parse(event.target.result);
            productDetails = importedData.productDetails || {};
            billHistory = importedData.billHistory || [];
            upiDetails = importedData.upiDetails || {};

            saveToLocalStorage('productDetails', productDetails);
            saveToLocalStorage('billHistory', billHistory);
            saveToLocalStorage('upiDetails', upiDetails);

            alert('Data imported successfully.');
        };
        reader.readAsText(file);
    });

    const html5QrCode1 = new Html5Qrcode("my-qr-reader-option1");
    const html5QrCode2 = new Html5Qrcode("my-qr-reader-option2");

    html5QrCode1.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        onScanSuccessOption1
    );

    html5QrCode2.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        onScanSuccessOption2
    );
});
