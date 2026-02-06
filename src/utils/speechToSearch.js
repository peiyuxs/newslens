export class SpeechToSearch {
  constructor(searchCallback, statusCallback) {
    this.recognition = null;
    this.searchCallback = searchCallback;
    this.statusCallback = statusCallback; // Callback for status updates (waiting for command, etc.)
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.isWaitingForCommand = false; // Flag to indicate if we're waiting for user command after wake word
    this.wakeWord = 'newslens'; // Wake word to activate command listening (simplified)
    this.restartTimeout = null;
    this.isStopping = false; // Prevent restart when manually stopping
    this.emptyResultCount = 0; // Track consecutive empty or invalid results
    this.maxEmptyResults = 3; // Max empty results before prompting user
  }

  init() {
    if (typeof window === 'undefined') return false;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.speak('Speech Recognition API is not supported in this browser.');
      console.error('Speech Recognition API is not supported in this browser.');
      return false;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true; // Enable interim results for better wake word detection
    this.recognition.continuous = true; // Keep listening continuously
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      // Get the latest result
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      const confidence = result[0].confidence;
      
      console.log('🎤 Speech result:', transcript, '(final:', isFinal + ')');
      console.log('   Confidence:', confidence);
      
      // Send recognized text to UI for debugging
      if (this.statusCallback) {
        this.statusCallback({ recognizedText: transcript + (isFinal ? ' ✓' : ' ...') });
      }
      
      const lowerTranscript = transcript.toLowerCase().trim();
      
      // Check if result is too short or empty
      if (isFinal && transcript.trim().length < 2) {
        this.emptyResultCount++;
        console.warn('Empty or too short result, count:', this.emptyResultCount);
        
        if (this.emptyResultCount >= this.maxEmptyResults) {
          this.speak('I am having trouble hearing you. Please check your microphone, speak clearly, and make sure you are close to the microphone. Try saying something like: sports news, or technology news.');
          this.emptyResultCount = 0; // Reset counter
        }
        return; // Don't process empty results
      }
      
      // Check if confidence is too low
      if (isFinal && confidence < 0.3) {
        console.warn('Low confidence result:', confidence);
        this.speak('I am not sure what you said. Please speak more clearly.');
        return; // Don't process low confidence results
      }
      
      // TESTING MODE: Disable wake word, directly process all final results
      console.log('   Testing mode: Processing all speech directly');
      
      // If got a final result with good confidence, process it directly
      if (isFinal && transcript.length > 2) {
        console.log('🔍 Processing speech directly (no wake word):', transcript);
        this.emptyResultCount = 0; // Reset counter on successful recognition
        
        // Clear the recognized text display before triggering search
        if (this.statusCallback) {
          this.statusCallback({ recognizedText: '' });
        }
        
        if (this.searchCallback) {
          this.searchCallback(transcript); // Pass the full user command
        }
      }
      
      /* WAKE WORD DETECTION DISABLED FOR TESTING
      // Check if wake word is detected (in both interim and final results)
      // More flexible matching: check for various forms
      const hasWakeWord = lowerTranscript.includes('newslens') || 
                         lowerTranscript.includes('news lens') || 
                         lowerTranscript.includes('new lens') ||
                         lowerTranscript.includes('use lens') ||
                         lowerTranscript.includes('hello news'); // For testing
      
      console.log('   Checking wake word:', hasWakeWord, '| Waiting for command:', this.isWaitingForCommand);
      
      if (!this.isWaitingForCommand && hasWakeWord) {
        console.log('✅ Wake word detected! Waiting for command...');
        this.isWaitingForCommand = true;
        if (this.statusCallback) {
          this.statusCallback({ isWaitingForCommand: true });
        }
        this.speak('Yes, I am listening. What news would you like to search for?');
        return;
      }
      
      // If we're waiting for command and got a final result, process it
      if (this.isWaitingForCommand && isFinal) {
        console.log('🔍 Processing user command:', transcript);
        this.isWaitingForCommand = false; // Reset the flag
        if (this.statusCallback) {
          this.statusCallback({ isWaitingForCommand: false });
        }
        if (this.searchCallback) {
          this.searchCallback(transcript); // Pass the full user command
        }
      }
      */
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      
      // Handle different error types with appropriate feedback
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected, continuing to listen...');
          // Don't stop, just keep listening
          break;
          
        case 'audio-capture':
          console.error('No microphone was found or microphone is not working');
          this.speak('No microphone was found. Please check your microphone connection and try again.');
          this.isListening = false;
          break;
          
        case 'not-allowed':
          console.error('Microphone permission denied');
          this.speak('Microphone access is denied. Please allow microphone access in your browser settings and refresh the page.');
          this.isListening = false;
          break;
          
        case 'network':
          console.error('Network error occurred');
          this.speak('Network error occurred. Please check your internet connection and try again.');
          // Try to restart after network error
          setTimeout(() => {
            if (!this.isStopping) {
              this.startListening();
            }
          }, 2000);
          break;
          
        case 'language-not-supported':
          console.error('Language not supported');
          this.speak('The selected language is not supported. Switching to English.');
          this.setLanguage('en-US');
          setTimeout(() => {
            if (!this.isStopping) {
              this.startListening();
            }
          }, 1500);
          break;
          
        case 'service-not-allowed':
          console.error('Speech recognition service not allowed');
          this.speak('Speech recognition service is not allowed. Please check your browser settings.');
          this.isListening = false;
          break;
          
        case 'aborted':
          // Normal interruption, just log it
          console.log('Speech recognition aborted, will restart automatically');
          break;
          
        default:
          console.warn('Unknown speech recognition error:', event.error);
          this.speak('Sorry, I could not understand. Please try speaking again.');
          // Try to restart after unknown error
          setTimeout(() => {
            if (!this.isStopping) {
              this.startListening();
            }
          }, 1500);
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended.');
      
      // Only restart if not manually stopping
      if (!this.isStopping && this.isListening) {
        console.log('Auto-restarting speech recognition...');
        this.restartTimeout = setTimeout(() => {
          if (this.recognition && !this.isStopping) {
            try {
              this.recognition.start();
              console.log('Speech recognition restarted successfully');
            } catch (error) {
              console.warn('Could not restart recognition:', error.message);
              this.isListening = false;
            }
          }
        }, 500);
      } else {
        this.isListening = false;
      }
    };

    return true;
  }

  startListening() {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.error('MediaDevices API not available');
      return;
    }

    // Don't start if already listening
    if (this.isListening) {
      console.log('Already listening...');
      return;
    }

    this.isStopping = false; // Reset stopping flag
    
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        if (this.recognition && !this.isListening) {
          try {
            this.recognition.start();
            this.isListening = true;
            console.log('Speech recognition started in continuous mode...');
          } catch (error) {
            console.error('Error starting recognition:', error);
            this.isListening = false;
          }
        }
      })
      .catch((err) => {
        console.error('Microphone access denied:', err);
        this.speak('Microphone access is required to use speech recognition. Please allow microphone access in your browser settings.');
        this.isListening = false;
      });
  }

  stopListening() {
    this.isStopping = true; // Set stopping flag to prevent auto-restart
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        console.log('Speech recognition stopped.');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Reset waiting state and notify
    if (this.isWaitingForCommand) {
      this.isWaitingForCommand = false;
      if (this.statusCallback) {
        this.statusCallback({ isWaitingForCommand: false });
      }
    }
    
    // Reset error count
    this.emptyResultCount = 0;
  }

  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
      console.log(`Speech recognition language set to: ${lang}`);
    }
  }

  speak(message) {
    if (this.synth && typeof window !== 'undefined') {
      // Cancel any ongoing speech to prioritize new messages
      this.synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume
      
      // Handle speech errors
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };
      
      // Log when speech starts and ends
      utterance.onstart = () => {
        console.log('🔊 Speaking:', message);
      };
      
      utterance.onend = () => {
        console.log('🔊 Speech finished');
      };
      
      this.synth.speak(utterance);
    } else {
      console.warn('Speech synthesis not available');
    }
  }

  resetWaitingState() {
    this.isWaitingForCommand = false;
  }

  getIsWaitingForCommand() {
    return this.isWaitingForCommand;
  }

  getIsListening() {
    return this.isListening;
  }

  resetErrorCount() {
    this.emptyResultCount = 0;
  }
}