const dropdownItems = document.querySelectorAll('.dropdown-item');

// Add click event listener to each item
dropdownItems.forEach(item => {
    item.addEventListener('click', (event) => {
        // Prevent default link behavior
        event.preventDefault();

        // Get the text of the clicked item
        const clickedValue = event.target.textContent;
        console.log('Clicked value:', clickedValue);
        window.location.href = `signin.html?value=${encodeURIComponent(clickedValue)}`;
        // window.open("signin.html");

        // You can perform additional actions with the clicked value here
    });
});