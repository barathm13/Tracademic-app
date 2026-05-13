document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const messageBox = document.getElementById('message');

  function showMessage(text, type = 'error') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
  }

  function setLoading(form, isLoading, label) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Please wait...' : label;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function redirectIfLoggedIn() {
    try {
      const session = await StudentTracker.auth.getSession();
      if (session) window.location.href = 'dashboard.html';
    } catch (error) {
      showMessage(error.message);
    }
  }

  if (loginForm || registerForm) {
    redirectIfLoggedIn();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) return showMessage('Please enter both email and password.');
      if (!validateEmail(email)) return showMessage('Please enter a valid email address.');

      try {
        setLoading(loginForm, true, 'Login');
        await StudentTracker.auth.login(email, password);
        showMessage('Login successful! Redirecting...', 'success');
        window.location.href = 'dashboard.html';
      } catch (error) {
        showMessage(error.message || 'Unable to login. Please check your credentials.');
      } finally {
        setLoading(loginForm, false, 'Login');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!name || !email || !password) return showMessage('Please fill in all required fields.');
      if (!validateEmail(email)) return showMessage('Please enter a valid email address.');
      if (password.length < 6) return showMessage('Password must be at least 6 characters long.');

      try {
        setLoading(registerForm, true, 'Create account');
        const data = await StudentTracker.auth.signUp(name, email, password);
        if (data.session) {
          showMessage('Account created successfully! Redirecting...', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        } else {
          showMessage('Registration successful! Check your email to confirm your account, then login.', 'success');
          registerForm.reset();
        }
      } catch (error) {
        showMessage(error.message || 'Unable to register. Please try again.');
      } finally {
        setLoading(registerForm, false, 'Create account');
      }
    });
  }
});
