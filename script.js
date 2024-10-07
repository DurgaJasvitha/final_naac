const urlParams = new URLSearchParams(window.location.search);
const value = urlParams.get('value');
sessionStorage.setItem('campus',value);
document.body.style.backgroundImage = `url(image/${value}.jpg)`;
document.getElementById('headingid').innerHTML ="Amrita NAAC Automation Portal <span style='color: #C30B4D;'>" + value + " Branch </span>" || 'No value selected.';




document.getElementById('signin-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    console.log(email);
    const password = document.getElementById('password').value;
    const branch =  document.getElementById('branch').value;
    sessionStorage.setItem('branch', branch);
    console.log(branch);
    
    const messageElement = document.querySelector('.message');

    if ((branch === 'AIE' && email === `${value}@aie.com` && password === 'aiePass') ||
    (branch === 'CSE' && email === `${value}@cse.com` && password === 'csePass') ||
    (branch === 'ECE' && email === `${value}@ece.com` && password === 'ecePass')) {
        
        messageElement.style.color = 'green';
        messageElement.textContent = 'Branch authentication successful! Redirecting to dashboard...';

        setTimeout(function() {
            // window.location.href = `signin.html?value=${encodeURIComponent(clickedValue)}`;
            window.location.href = `dashboard_${value}.html?value=${encodeURIComponent(branch)}`; // Redirect to campus-branch dashboard
        }, 1000);

    } else {
        setTimeout(function() {
            messageElement.style.color = 'red';
        messageElement.textContent = 'Invalid branch email or password.'; 
        }, 1000);
       
    }

    // Simple validation
    // if (email === 'bangalore@amrita.com' && password === 'password@123') {
    //     messageElement.style.color = 'green';
    //     messageElement.textContent = 'Sign-in successful!';
    //     setTimeout(function() {
    //         window.location.href = 'dashboard_bangalore.html'; // Redirect to dashboard.html
    //     }, 1000);
    // } 

    // else if (email === 'chennai@amrita.com' && password === 'password@234') {
    //     messageElement.style.color = 'green';
    //     messageElement.textContent = 'Sign-in successful!';

    //     setTimeout(function() {
    //         window.location.href = 'dashboard_chennai.html'; // Redirect to dashboard.html
    //     }, 1000);
    // } 
    // else if (email === 'amritapuri@amrita.com' && password === 'password@123') {
    //     messageElement.style.color = 'green';
    //     messageElement.textContent = 'Sign-in successful!';
    //     setTimeout(function() {
    //         window.location.href = 'dashboard_amritapuri.html'; // Redirect to dashboard.html
    //     }, 1000);
    // } 

    // else if (email === 'coimbatore@amrita.com' && password === 'password@234') {
    //     messageElement.style.color = 'green';
    //     messageElement.textContent = 'Sign-in successful!';

    //     setTimeout(function() {
    //         window.location.href = 'dashboard_coimbatore.html'; // Redirect to dashboard.html
    //     }, 1000);
    // } 

    // else if (email === 'IQAC@amrita.com' && password === 'password@234') {
    //     messageElement.style.color = 'green';
    //     messageElement.textContent = 'Sign-in successful!';

    //     setTimeout(function() {
    //         window.location.href = 'dashboard_secondary.html'; // Redirect to dashboard.html
    //     }, 1000);
    // } 
    // else {
    //     messageElement.style.color = 'red';
    //     messageElement.textContent = 'Invalid email or password';
    // }
});
