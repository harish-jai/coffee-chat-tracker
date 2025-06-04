import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Reset needsEmailConfirmation when changing modes
  useEffect(() => {
    setNeedsEmailConfirmation(false);
  }, [mode]);

  // Check for password reset token on page load
  useEffect(() => {
    const params = new URLSearchParams(location.hash.replace('#', '?'));
    const type = params.get('type');
    const access_token = params.get('access_token');

    if (type === 'recovery' && access_token) {
      setMode('reset');
      supabase.auth.setSession({ access_token, refresh_token: '' });
    }
  }, [location]);

  // Email/password login or signup
  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);
    const isSignup = mode === 'signup';

    try {
      if (isSignup) {
        // Handle Sign Up
        console.log('Attempting signup for:', email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              email_confirm_sent: new Date().toISOString()
            }
          }
        });

        console.log('Detailed signup response:', {
          user: data?.user,
          session: data?.session,
          error,
          identities: data?.user?.identities,
          emailConfirmed: data?.user?.email_confirmed_at,
          confirmationSentAt: data?.user?.confirmation_sent_at
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          if (error.message.includes('Password should be at least 6 characters')) {
            throw new Error('Password must be at least 6 characters long.');
          }
          if (error.message.includes('Invalid email')) {
            throw new Error('Please enter a valid email address.');
          }
          throw error;
        }

        if (data.user) {
          console.log('User created:', data.user);

          // Create user preferences record
          const { error: prefsError } = await supabase
            .from('user_preferences')
            .insert({ user_id: data.user.id });

          if (prefsError) {
            console.error('Error creating user preferences:', prefsError);
            // Don't block signup if preferences creation fails
          }

          // Check if email is already confirmed (shouldn't happen on signup)
          if (data.user.email_confirmed_at) {
            console.warn('Email already confirmed at signup - unexpected state');
            setError('This email is already registered. Please try signing in instead.');
            setMode('login');
            return;
          }

          // Check if we got a session (shouldn't happen until email is confirmed)
          if (data.session) {
            console.warn('Received session at signup - unexpected state');
            setError('This email might already be registered. Please try signing in or use a different email.');
            return;
          }

          // Normal signup flow - email needs confirmation
          alert(`Account created! Please check your email (${email}) for a confirmation link. You won't be able to log in until you confirm your email.\n\nIf you don't see the email, please:\n1. Check your spam folder\n2. Click "Resend confirmation email" below\n3. Make sure you entered your email correctly`);

          setMode('login');
          setPassword('');
          setNeedsEmailConfirmation(true);
        } else {
          throw new Error('Signup failed: No user data received');
        }
      } else {
        // Handle Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. If you signed up with Google, please use the "Sign in with Google" button.');
          }
          if (error.message.includes('Email not confirmed')) {
            setNeedsEmailConfirmation(true);
            // Try to resend confirmation email
            console.log('Attempting to resend confirmation email for:', email);
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email,
              options: {
                emailRedirectTo: `${window.location.origin}/login`,
              }
            });

            if (resendError) {
              console.error('Error resending confirmation:', resendError);
              throw new Error('Email not confirmed. Please check your email for the confirmation link, including spam folder.');
            } else {
              throw new Error('Your email is not confirmed. A new confirmation email has been sent - please check your inbox and spam folder.');
            }
          }
          throw error;
        }

        // Reset needsEmailConfirmation on successful login
        setNeedsEmailConfirmation(false);

        if (data.user) {
          // Verify email is confirmed before proceeding
          if (!data.user.email_confirmed_at) {
            console.warn('Logged in but email not confirmed - unexpected state');
            throw new Error('Please confirm your email address before signing in. Check your email for the confirmation link.');
          }

          // Check if user preferences exist
          const { data: prefs, error: prefsError } = await supabase
            .from('user_preferences')
            .select('user_id')
            .eq('user_id', data.user.id)
            .single();

          if (prefsError && !prefs) {
            // Create user preferences if they don't exist
            const { error: createError } = await supabase
              .from('user_preferences')
              .insert({ user_id: data.user.id });

            if (createError) {
              console.error('Error creating user preferences:', createError);
              // Don't block login if preferences creation fails
            }
          }

          navigate('/');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password (send reset link)
  const handlePasswordResetRequest = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        if (error.message.includes('Email not found')) {
          throw new Error('No account found with this email address. Please check the email or sign up for a new account.');
        }
        throw error;
      }
      alert('If an account exists with this email, you will receive a password reset link.');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set new password after password reset
  const handlePasswordResetConfirm = async () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated successfully! You can now log in with your new password.');
      setMode('login');
      navigate('/login');
    } catch (err) {
      if (err.message.includes('Auth session missing')) {
        setError('Password reset link has expired. Please request a new one.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Failed to connect to Google. Please try again.');
      setLoading(false);
    }
  };

  // Add a function to resend confirmation email
  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (error) throw error;
      alert('If this email is registered, a new confirmation email will be sent. Please check your inbox and spam folder.');
    } catch (err) {
      console.error('Error resending confirmation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>
            {mode === 'reset' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          {mode !== 'reset' && (
            <p className={styles.loginSubtitle}>
              {mode === 'signup' ? 'Create your account to get started' : 'Sign in to continue'}
            </p>
          )}
        </div>

        {mode === 'reset' ? (
          <div>
            <div className={styles.formGroup}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
              />
            </div>
            <button
              onClick={handlePasswordResetConfirm}
              disabled={loading}
              className={`${styles.submitButton} button-primary`}
            >
              {loading ? 'Setting New Password...' : 'Set New Password'}
            </button>
          </div>
        ) : (
          <div>
            <div className={styles.formGroup}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show Password
              </label>
            </div>

            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className={`${styles.submitButton} ${styles['button-primary']}`}
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>

            {needsEmailConfirmation && mode === 'login' && (
              <div className={styles.toggleContainer}>
                <button
                  onClick={handleResendConfirmation}
                  className={styles.toggleLink}
                >
                  Resend confirmation email
                </button>
              </div>
            )}

            <div className={styles.toggleContainer}>
              <span>OR</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`${styles.submitButton} ${styles['button-secondary']}`}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                style={{
                  width: '16px',
                  height: '16px',
                }}
              />
              Sign in with Google
            </button>

            <div className={styles.toggleContainer}>
              {mode === 'login' ? (
                <>
                  <button
                    onClick={() => setMode('signup')}
                    className={styles.toggleLink}
                  >
                    Don't have an account? Sign up
                  </button>
                  <button
                    onClick={handlePasswordResetRequest}
                    className={styles.toggleLink}
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setMode('login')}
                  className={styles.toggleLink}
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>

            {error && (
              <div className={styles.error}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
