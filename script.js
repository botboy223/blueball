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

    document.getElementById('generate-bill').addEventListener('click', () => {
        const totalAmount = document.getElementById('total').innerText.split('₹')[1];

        if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
            alert('Please set up your UPI details in the UPI QR Code section first.');
            return;
        }

        const billId = `BILL-${new Date().getTime()}`;
        const billDate = new Date().toLocaleString();

        const bill = {
            billId,
            billDate,
            totalAmount,
            products: [...cart]
        };

        billHistory.push(bill);
        saveToLocalStorage('billHistory', billHistory);

        alert('Bill generated successfully.');

        // Optionally, clear the cart after generating the bill
        cart = [];
        displayCart();
        displayBillHistory();
    });

    function displayBillHistory() {
        const billHistoryDiv = document.getElementById('bill-history');
        billHistoryDiv.innerHTML = '';

        billHistory.forEach((bill, index) => {
            const billDiv = document.createElement('div');
            let productDetailsHtml = '<ul>';

            bill.products.forEach(product => {
                const productDetail = productDetails[product.code];
                productDetailsHtml += `
                    <li>
                        ${productDetail.name} - ₹${productDetail.price} 
                        Quantity: ${product.quantity}
                    </li>
                `;
            });

            productDetailsHtml += '</ul>';

            billDiv.innerHTML = `
                <div>
                    Bill ID: ${bill.billId}<br>
                    Date: ${bill.billDate}<br>
                    Total Amount: ₹${bill.totalAmount}<br>
                    Products: ${productDetailsHtml}
                </div>
                <button onclick="deleteBill(${index})">Delete Bill</button>
            `;

            billHistoryDiv.appendChild(billDiv);
        });
    }

    window.deleteBill = function(index) {
        billHistory.splice(index, 1);
        saveToLocalStorage('billHistory', billHistory);
        displayBillHistory();
    };

    let html5QrcodeScannerOption1 = new Html5QrcodeScanner(
        "my-qr-reader-option1",
        {
            fps: 30,
            qrbox: { width: 250, height: 250 },
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        }
    );
    html5QrcodeScannerOption1.render(onScanSuccessOption1);

    let html5QrcodeScannerOption2 = new Html5QrcodeScanner(
        "my-qr-reader-option2",
        {
            fps: 30,
            qrbox: { width: 250, height: 250 },
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        }
    );
    html5QrcodeScannerOption2.render(onScanSuccessOption2);

    displayBillHistory();
});
