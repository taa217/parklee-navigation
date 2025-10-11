import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const Verification: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(6).fill(''));
  const [email, setEmail] = useState<string>(''); // Add state for email
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [showResendMessage, setShowResendMessage] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const countdown = setInterval(() => {
      if (timer > 0) {
        setTimer(prev => prev - 1);
      } else {
        setCanResend(true);
        clearInterval(countdown);
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [timer]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setShowResendMessage(true);
    setTimeout(() => setShowResendMessage(false), 3000);
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    // Prepare the API data
    try {
      const response = await fetch('http://localhost:8000/users/verify/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email, // Send the email
          verification_code: code, // Send the 6-digit code directly
        }),
      });
      console.log('verification info', email, verificationCode)

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          alert('Email verified successfully!'); // Show alert
          navigate('/login'); // Redirect to login page
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setError('There was an error verifying the code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-16 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Email Verification</h1>
        <p className="text-center text-gray-600 mb-6">Enter your email and the code sent to your email</p>

        {/* Email Input Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="flex justify-between mb-8">
          {[...Array(6)].map((_, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={verificationCode[index]}
              onChange={e => handleInput(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-12 border-2 rounded-lg text-center text-xl font-semibold text-gray-800 focus:border-blue-500 focus:outline-none"
            />
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Haven't received the code? {timer > 0 ? `(${timer}s)` : ''}
          </p>
          <button
            onClick={handleResend}
            className={`text-sm ${canResend ? 'text-blue-600 cursor-pointer' : 'text-gray-400'}`}
          >
            Resend Code
          </button>
          {showResendMessage && (
            <p className="text-green-500 text-sm mt-2">Code sent!</p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium !rounded-button hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : isSuccess ? (
            <span><i className="fas fa-check mr-2"></i>Verified</span>
          ) : (
            'Verify'
          )}
        </button>

        <button className="w-full text-gray-600 py-3 mt-4 rounded-lg font-medium !rounded-button hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>

     
    </div>
  );
};

export default Verification;
