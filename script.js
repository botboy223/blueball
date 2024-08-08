document.addEventListener('DOMContentLoaded', function () {
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
                        Product Name: ${productDetail.name} <br>
                        Price: ₹${productDetail.price} <br>
                        Quantity: ${product.quantity} <br>
                        Total: ₹${productDetail.price * product.quantity}
                    </li>
                `;
            });

            productDetailsHtml += '</ul>';

            billDiv.innerHTML = `
                <div>
                    <strong>Bill ID:</strong> ${bill.billId} <br>
                    <strong>Date:</strong> ${bill.billDate} <br>
                    <strong>Total Amount:</strong> ₹${bill.totalAmount} <br>
                    <strong>Products:</strong> ${productDetailsHtml}
                </div>
                <button onclick="deleteBill(${index})">Delete Bill</button>
                <hr>
            `;

            billHistoryDiv.appendChild(billDiv);
        });
    }

    window.deleteBill = function(index) {
        if (confirm('Are you sure you want to delete this bill?')) {
            billHistory.splice(index, 1);
            saveToLocalStorage('billHistory', billHistory);
            displayBillHistory();
        }
    };

    function switchToOption1() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        document.getElementById('option1').style.display = 'block';

        const qrCodeReader = new Html5Qrcode("my-qr-reader-option1");
        qrCodeReader.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccessOption1);
    }

    function switchToOption2() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        document.getElementById('option2').style.display = 'block';

        const qrCodeReader = new Html5Qrcode("my-qr-reader-option2");
        qrCodeReader.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccessOption2);
    }

    function switchToOption3() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        document.getElementById('option3').style.display = 'block';

        document.getElementById('qrForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const upiId = document.getElementById('upi_id').value;
            const name = document.getElementById('name').value;
            const note = document.getElementById('note').value;

            upiDetails = { upiId, name, note };
            saveToLocalStorage('upiDetails', upiDetails);
            alert('UPI details saved.');

            const qrData = `upi://pay?pa=${upiId}&pn=${name}&tn=${note}`;
            const qrCode = new QRCodeStyling({
                data: qrData,
                width: 300,
                height: 300,
                image: "",
                dotsOptions: { color: "#000", type: "rounded" },
                backgroundOptions: { color: "#fff" },
                imageOptions: { crossOrigin: "anonymous", margin: 20 }
            });

            qrCode.append(document.getElementById('qrCode'));
        });
    }

    function switchToOption4() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        document.getElementById('option4').style.display = 'block';

        document.getElementById('download-data').addEventListener('click', () => {
            const dataStr = JSON.stringify({ productDetails, billHistory });
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        document.getElementById('upload-data').addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = JSON.parse(e.target.result);
                    productDetails = data.productDetails || {};
                    billHistory = data.billHistory || [];
                    saveToLocalStorage('productDetails', productDetails);
                    saveToLocalStorage('billHistory', billHistory);
                    alert('Data imported successfully.');
                };
                reader.readAsText(file);
            }
        });
    }

    function switchToOption5() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        document.getElementById('option5').style.display = 'block';
        displayBillHistory();
    }

    function saveToLocalStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function loadFromLocalStorage(key) {
        return JSON.parse(localStorage.getItem(key));
    }
});
