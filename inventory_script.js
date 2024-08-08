// inventory_script.js
document.addEventListener('DOMContentLoaded', function () {
    const inventoryDiv = document.getElementById('inventory');
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = loadFromLocalStorage('cart') || [];

    function updateInventory() {
        const inventory = {};

        // Initialize inventory with product details
        for (const barcode in productDetails) {
            inventory[barcode] = {
                ...productDetails[barcode],
                currentQuantity: 0,
                salesData: []
            };
        }

        // Calculate current quantity and sales data from the cart
        cart.forEach(item => {
            if (inventory[item.code]) {
                inventory[item.code].currentQuantity += item.quantity;
                inventory[item.code].salesData.push(item.quantity);
            }
        });

        // Display inventory
        displayInventory(inventory);
    }

    function displayInventory(inventory) {
        inventoryDiv.innerHTML = '';

        for (const barcode in inventory) {
            const product = inventory[barcode];
            const salesData = product.salesData.reduce((total, quantity) => total + quantity, 0);

            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
                <div>
                    <strong>${product.name}</strong><br>
                    Barcode: ${barcode}<br>
                    Price: ₹${product.price}<br>
                    Current Quantity: ${product.currentQuantity}<br>
                    Sales Data: ${salesData} (total sold quantity)
                    <br>
                    Edit Quantity: <input type="number" value="${product.currentQuantity}" min="0" data-barcode="${barcode}">
                </div>
            `;

            inventoryDiv.appendChild(itemDiv);
        }

        // Add event listener for editing quantities
        inventoryDiv.addEventListener('input', (event) => {
            const input = event.target;
            if (input.type === 'number') {
                const barcode = input.dataset.barcode;
                const newQuantity = parseInt(input.value, 10);

                if (!isNaN(newQuantity)) {
                    productDetails[barcode].currentQuantity = newQuantity;
                    saveToLocalStorage('productDetails', productDetails);
                }
            }
        });
    }

    // Initialize the inventory view
    updateInventory();

    // Optional: refresh inventory when switching to this option
    window.switchToOption6 = function () {
        document.getElementById('option1').style.display = 'none';
        document.getElementById('option2').style.display = 'none';
        document.getElementById('option3').style.display = 'none';
        document.getElementById('option4').style.display = 'none';
        document.getElementById('option5').style.display = 'none';
        document.getElementById('option6').style.display = 'block';

        updateInventory();
    };
});
