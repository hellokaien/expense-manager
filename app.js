  //Global Functions

  function showNotification(message, type = 'success') {
          const notification = document.getElementById('notificationToast');
          const notificationMessage = document.getElementById('notificationMessage');
          
          // Remove any existing animation classes
          notification.classList.remove('notification-slide-in', 'notification-slide-out');
          
          // Set message and color based on type
          notificationMessage.textContent = message;
          
          if (type === 'success') {
              notification.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center';
              notification.innerHTML = '<i class="fas fa-check-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
          } else if (type === 'error') {
              notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center';
              notification.innerHTML = '<i class="fas fa-exclamation-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
          } else if (type === 'warning') {
              notification.className = 'fixed top-4 right-4 z-50 bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center';
              notification.innerHTML = '<i class="fas fa-exclamation-triangle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
          } else {
              notification.className = 'fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center';
              notification.innerHTML = '<i class="fas fa-info-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
          }
          
          // Show notification with slide-in animation
          notification.classList.remove('hidden');
          // Force reflow to ensure animation runs
          void notification.offsetWidth;
          notification.classList.add('notification-slide-in');
          
          // Clear any existing timeout
          if (window.notificationTimeout) {
              clearTimeout(window.notificationTimeout);
          }
          
          // Hide after 3 seconds with slide-out animation
          window.notificationTimeout = setTimeout(() => {
              // Add slide-out animation
              notification.classList.remove('notification-slide-in');
              notification.classList.add('notification-slide-out');
              
              // Hide after animation completes
              setTimeout(() => {
                  notification.classList.add('hidden');
                  notification.classList.remove('notification-slide-out');
              }, 300); // Match this with animation duration
          }, 3000);
  }

  function logout() {
        // Clear user data from localStorage
        localStorage.removeItem('moneyflow_user');
        localStorage.removeItem('moneyflow_logged_in');
        localStorage.removeItem('moneyflow_user_id');
        localStorage.removeItem('moneyflow_remember_me');
        localStorage.removeItem('moneyflow_session_expiry');
        
        // Close logout modal
        logoutModal.classList.add('hidden');
        
        // Show notification
        showNotification('Logged out successfully!', 'info');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
  }

  function dd(data){
    console.log(data);
  }