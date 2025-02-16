function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

window.jsPDF = window.jspdf.jsPDF;

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];
    let inventory = loadFromLocalStorage('inventory') || {};

    // ... (Keep all other functions like updateInventory, displayInventory, etc. here)

    // Ensure all functions are globally accessible by defining them here
    function showMoreOptions() {
        console.log("More button clicked!");
        document.getElementById('moreOptions').classList.toggle('hidden');
        updateDashboard();
    }

    function switchToOption1() {
        hideAllOptions();
        document.getElementById('option1').style.display = 'block';
    }

    function switchToOption2() {
        hideAllOptions();
        document.getElementById('option2').style.display = 'block';
    }

    function switchToOption3() {
        hideAllOptions();
        document.getElementById('option3').style.display = 'block';
    }

    function switchToOption4() {
        hideAllOptions();
        document.getElementById('option4').style.display = 'block';
    }

    function switchToOption5() {
        hideAllOptions();
        document.getElementById('option5').style.display = 'block';
    }

    function switchToInventory() {
        hideAllOptions();
        document.getElementById('inventory-option').style.display = 'block';
        displayInventory();
    }

    function hideAllOptions() {
        document.querySelectorAll('.option').forEach(option => option.style.display = 'none');
        document.getElementById('dashboard').classList.remove('hidden');
    }

    // Event listeners for all buttons
    document.getElementById('moreButton').addEventListener('click', showMoreOptions);
    document.getElementById('moreButton').addEventListener('touchstart', showMoreOptions);

    document.getElementById('option1-button').addEventListener('click', switchToOption1);
    document.getElementById('option2-button').addEventListener('click', switchToOption2);
    document.getElementById('option3-button').addEventListener('click', switchToOption3);
    document.getElementById('option4-button').addEventListener('click', switchToOption4);
    document.getElementById('option5-button').addEventListener('click', switchToOption5);
    document.getElementById('inventory-button').addEventListener('click', switchToInventory);

    // Initial setup
    switchToOption2(); // Default to cart view
    updateDashboard();
});
