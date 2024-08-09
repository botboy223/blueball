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
            alert('Product saved successfully!');
        } else {
            alert('Please fill out all fields.');
        }
    });

    document.getElementById('generate-bill').addEventListener('click', () => {
        const totalAmount = document.getElementById('total').innerText.split('₹')[1];
        const billId = Date.now(); // Unique ID using current timestamp
        const dateTime = new Date().toLocaleString();

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

        const bill = {
            id: billId,
            dateTime: dateTime,
            totalAmount: totalAmount,
            items: cart.map(item => ({
                code: item.code,
                name: productDetails[item.code].name,
                price: productDetails[item.code].price,
                quantity: item.quantity
            })),
            upiUrl: upiUrl
        };

        let billHistory = loadFromLocalStorage('billHistory') || [];
        billHistory.push(bill);
        saveToLocalStorage('billHistory', billHistory);

        alert('Total Bill: ₹' + totalAmount);
    });

    document.getElementById('qrForm').addEventListener('submit', (event) => {
        event.preventDefault();

        upiDetails = {
            upiId: document.getElementById('upi_id').value,
            name: document.getElementById('name').value,
            note: document.getElementById('note').value
        };

        saveToLocalStorage('upiDetails', upiDetails);

        const upiUrl = `upi://pay?pa=${upiDetails.upiId}&pn=${upiDetails.name}&cu=INR&tn=${upiDetails.note}`;

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

        document.getElementById('qrCode').innerHTML = '';
        qrCode.append(document.getElementById('qrCode'));
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails: productDetails,
            upiDetails: upiDetails,
            billHistory: loadFromLocalStorage('billHistory') || []
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "data.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    });

    document.getElementById('upload-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = JSON.parse(e.target.result);
                if (data.productDetails) productDetails = data.productDetails;
                if (data.upiDetails) upiDetails = data.upiDetails;
                if (data.billHistory) saveToLocalStorage('billHistory', data.billHistory);
                alert('Data imported successfully!');
            };
            reader.readAsText(file);
        }
    });

    function displayBillHistory() {
        const billHistoryDiv = document.getElementById('bill-history');
        billHistoryDiv.innerHTML = ''; // Clear previous content

        let billHistory = loadFromLocalStorage('billHistory') || [];

        billHistory.forEach(bill => {
            const billDiv = document.createElement('div');
            billDiv.className = 'bill-entry';
            billDiv.innerHTML = `
                <div>
                    <strong>Bill ID:</strong> ${bill.id} <br>
                    <strong>Date/Time:</strong> ${bill.dateTime} <br>
                    <strong>Total Amount:</strong> ₹${bill.totalAmount}
                </div>
                <button onclick="viewBillDetails(${bill.id})">View Details</button>
                <button onclick="deleteBill(${bill.id})">Delete</button>
            `;
            billHistoryDiv.appendChild(billDiv);
        });
    }

    window.viewBillDetails = function viewBillDetails(billId) {
        let billHistory = loadFromLocalStorage('billHistory') || [];
        const bill = billHistory.find(b => b.id === billId);

        if (bill) {
            let details = `Bill ID: ${bill.id}\nDate/Time: ${bill.dateTime}\nTotal Amount: ₹${bill.totalAmount}\n\nItems:\n`;

            bill.items.forEach(item => {
                details += `${item.name} - ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n`;
            });

            alert(details);
        } else {
            alert('Bill not found.');
        }
    };

    window.deleteBill = function deleteBill(billId) {
        let billHistory = loadFromLocalStorage('billHistory') || [];
        billHistory = billHistory.filter(b => b.id !== billId);
        saveToLocalStorage('billHistory', billHistory);
        displayBillHistory(); // Refresh the bill history list
        alert('Bill deleted successfully.');
    };

    const html5QrCodeOption1 = new Html5Qrcode("my-qr-reader-option1");
    html5QrCodeOption1.start(
        { facingMode: "environment" }, 
        {
            fps: 10, 
            qrbox: 250 
        },
        onScanSuccessOption1
    ).catch(err => {
        console.log("Unable to start scanning for option 1.", err);
    });

    const html5QrCodeOption2 = new Html5Qrcode("my-qr-reader-option2");
    html5QrCodeOption2.start(
        { facingMode: "environment" }, 
        {
            fps: 10, 
            qrbox: 250 
        },
        onScanSuccessOption2
    ).catch(err => {
        console.log("Unable to start scanning for option 2.", err);
    });
});
