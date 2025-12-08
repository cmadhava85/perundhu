import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './VoiceContributionRecorder.css';

// Type declarations for Web Speech API
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventType {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventType {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventType) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionType;
}

interface VoiceContributionRecorderProps {
  onTranscription: (transcribedText: string, audioBlob: Blob) => void;
  language?: 'en-IN' | 'ta-IN' | 'auto';
  maxDuration?: number; // in seconds
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export const VoiceContributionRecorder: React.FC<VoiceContributionRecorderProps> = ({
  onTranscription,
  language = 'auto',
  maxDuration = 120 // 2 minutes default
}) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en-IN' | 'ta-IN' | 'auto'>(language);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Check browser support for both MediaRecorder and Web Speech API
  const isBrowserSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const isSpeechRecognitionSupported = () => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  };

  useEffect(() => {
    // Initialize Web Speech API
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      
      // Set language based on selection
      if (selectedLanguage === 'auto') {
        recognitionRef.current.lang = 'en-IN'; // Default to English
      } else {
        recognitionRef.current.lang = selectedLanguage;
      }

      // Handle recognition results
      recognitionRef.current.onresult = (event: SpeechRecognitionEventType) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setTranscribedText((prev) => prev + final);
        }
        setInterimTranscript(interim);
      };

      // Handle recognition errors
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEventType) => {
        // Speech recognition error occurred
        if (event.error === 'no-speech') {
          // Ignore no-speech errors during recording
          return;
        }
        setError(t('voice.error.recognitionFailed', 'Speech recognition failed. Please try again.'));
      };

      // Handle recognition end
      recognitionRef.current.onend = () => {
        // Restart if still recording and not paused
        if (isRecording && !isPaused && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Ignore if already started
          }
        }
      };
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors on cleanup
        }
      }
    };
  }, [selectedLanguage, isRecording, isPaused, t]);

  const startRecording = async () => {
    if (!isBrowserSupported()) {
      setError(t('voice.error.notSupported', 'Your browser does not support audio recording'));
      return;
    }

    setError('');
    audioChunksRef.current = [];
    setTranscribedText('');
    setInterimTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start Web Speech Recognition if supported
      if (isSpeechRecognitionSupported() && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Speech recognition start failed silently
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch {
      // Error accessing microphone
      setError(t('voice.error.microphoneAccess', 'Could not access microphone. Please check permissions.'));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Speech recognition stop failed silently
        }
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Speech recognition start failed silently
        }
      }
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Speech recognition stop failed silently
        }
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioURL('');
    setRecordingTime(0);
    setTranscribedText('');
    setInterimTranscript('');
    audioChunksRef.current = [];
    setError('');
  };

  const handleSubmit = async () => {
    if (!audioURL) {
      setError(t('voice.error.noRecording', 'No recording available'));
      return;
    }

    if (!transcribedText || transcribedText.trim().length === 0) {
      setError(t('voice.error.noTranscription', 'No transcription available. Please try recording again.'));
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get the audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Use the transcribed text from Web Speech API
      const finalTranscription = transcribedText.trim();

      // Pass transcribed text and audio blob to parent
      onTranscription(finalTranscription, audioBlob);
      
      // Reset
      setAudioURL('');
      setRecordingTime(0);
      setTranscribedText('');
      setInterimTranscript('');
      audioChunksRef.current = [];
    } catch {
      // Error processing recording
      setError(t('voice.error.processing', 'Failed to process recording. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder-container">
      <div className="voice-recorder-card">
        {/* Language Selector */}
        <div className="language-selector">
          <label className="selector-label">
            <span className="label-icon">🌐</span>
            {t('voice.language', 'Recording Language')}
          </label>
          <div className="language-options">
            <button
              className={`lang-btn ${selectedLanguage === 'en-IN' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('en-IN')}
              disabled={isRecording}
            >
              English
            </button>
            <button
              className={`lang-btn ${selectedLanguage === 'ta-IN' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('ta-IN')}
              disabled={isRecording}
            >
              தமிழ் (Tamil)
            </button>
            <button
              className={`lang-btn ${selectedLanguage === 'auto' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('auto')}
              disabled={isRecording}
            >
              {t('voice.auto', 'Auto Detect')}
            </button>
          </div>
        </div>

        {/* Help Guide Toggle */}
        <div className="help-guide-toggle">
          <button 
            className="help-btn"
            onClick={() => setShowHelpGuide(!showHelpGuide)}
            type="button"
          >
            <span className="help-icon">💡</span>
            <span>{showHelpGuide ? t('voice.hideGuide', 'Hide Guide') : t('voice.showGuide', 'How to Use Voice Input?')}</span>
          </button>
        </div>

        {/* Expandable Help Guide */}
        {showHelpGuide && (
          <div className="help-guide-panel">
            <h4 className="help-title">
              <span className="title-icon">🎯</span>
              {t('voice.helpTitle', 'Voice Input Guide')}
            </h4>
            
            <div className="help-sections">
              {/* What to Say */}
              <div className="help-section">
                <h5 className="section-title">
                  <span className="section-icon">🗣️</span>
                  {t('voice.whatToSay', 'What to Say')}
                </h5>
                <ul className="help-list">
                  <li>
                    <strong>{t('voice.busNumber', 'Bus Number')}:</strong> {t('voice.busNumberExample', '"Bus 27D" or "Route 570"')}
                  </li>
                  <li>
                    <strong>{t('voice.locations', 'Locations')}:</strong> {t('voice.locationsExample', '"From Chennai to Madurai"')}
                  </li>
                  <li>
                    <strong>{t('voice.timings', 'Timings')}:</strong> {t('voice.timingsExample', '"Leaves at 6 AM, arrives at 2 PM"')}
                  </li>
                  <li>
                    <strong>{t('voice.stops', 'Stops')}:</strong> {t('voice.stopsExample', '"Stops at Tambaram, Chengalpattu"')}
                  </li>
                </ul>
              </div>

              {/* Example Phrases */}
              <div className="help-section example-section">
                <h5 className="section-title">
                  <span className="section-icon">✨</span>
                  {t('voice.examplePhrases', 'Example Phrases')}
                </h5>
                <div className="example-cards">
                  <div className="example-card">
                    <div className="example-lang">🇬🇧 English</div>
                    <p className="example-text">
                      "Bus 27D from Chennai Central to Madurai, leaves at 6 AM, arrives at 2 PM, stops at Tambaram and Chengalpattu"
                    </p>
                  </div>
                  <div className="example-card">
                    <div className="example-lang">🇮🇳 தமிழ்</div>
                    <p className="example-text">
                      "பஸ் 570 சென்னையில் இருந்து மதுரைக்கு காலை 5 மணிக்கு புறப்பட்டு மாலை 11 மணிக்கு வரும்"
                    </p>
                  </div>
                  <div className="example-card">
                    <div className="example-lang">🔀 Mixed</div>
                    <p className="example-text">
                      "Bus 27D Chennai to Madurai காலை 6 மணி departure இரவு 2 மணி arrival"
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips for Better Recognition */}
              <div className="help-section tips-section">
                <h5 className="section-title">
                  <span className="section-icon">⚡</span>
                  {t('voice.tipsTitle', 'Tips for Better Recognition')}
                </h5>
                <div className="tips-grid">
                  <div className="tip-card">
                    <span className="tip-icon">🔇</span>
                    <span className="tip-text">{t('voice.tip.quiet', 'Find a quiet place')}</span>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">🎤</span>
                    <span className="tip-text">{t('voice.tip.close', 'Speak close to mic')}</span>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">🐢</span>
                    <span className="tip-text">{t('voice.tip.clear', 'Speak clearly & slowly')}</span>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">🔊</span>
                    <span className="tip-text">{t('voice.tip.volume', 'Use normal volume')}</span>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">⏸️</span>
                    <span className="tip-text">{t('voice.tip.pause', 'Pause between sections')}</span>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">🔢</span>
                    <span className="tip-text">{t('voice.tip.numbers', 'Say numbers clearly')}</span>
                  </div>
                </div>
              </div>

              {/* Browser Compatibility */}
              <div className="help-section compatibility-section">
                <h5 className="section-title">
                  <span className="section-icon">🌐</span>
                  {t('voice.browserCompatibility', 'Browser Compatibility')}
                </h5>
                <div className="browser-list">
                  <div className="browser-item supported">
                    <span className="browser-icon">✅</span>
                    <span>Chrome / Edge / Safari</span>
                  </div>
                  <div className="browser-item not-supported">
                    <span className="browser-icon">❌</span>
                    <span>Firefox (Not supported)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="recording-controls">
          {!isRecording && !audioURL && (
            <button className="record-btn start" onClick={startRecording}>
              <span className="btn-icon">🎤</span>
              <span className="btn-text">{t('voice.startRecording', 'Start Recording')}</span>
            </button>
          )}

          {isRecording && (
            <div className="recording-active">
              <div className="recording-indicator">
                <span className="pulse-dot"></span>
                <span className="recording-text">{t('voice.recording', 'Recording...')}</span>
                <span className="recording-time">{formatTime(recordingTime)}</span>
              </div>

              <div className="recording-actions">
                {!isPaused ? (
                  <button className="control-btn pause" onClick={pauseRecording}>
                    <span>⏸️</span>
                    <span>{t('voice.pause', 'Pause')}</span>
                  </button>
                ) : (
                  <button className="control-btn resume" onClick={resumeRecording}>
                    <span>▶️</span>
                    <span>{t('voice.resume', 'Resume')}</span>
                  </button>
                )}
                
                <button className="control-btn stop" onClick={stopRecording}>
                  <span>⏹️</span>
                  <span>{t('voice.stop', 'Stop')}</span>
                </button>
                
                <button className="control-btn cancel" onClick={cancelRecording}>
                  <span>❌</span>
                  <span>{t('voice.cancel', 'Cancel')}</span>
                </button>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                ></div>
              </div>
              <p className="time-limit">
                {t('voice.maxDuration', `Maximum duration: ${Math.floor(maxDuration / 60)} minutes`)}
              </p>
            </div>
          )}

          {audioURL && !isRecording && (
            <div className="playback-section">
              <div className="playback-header">
                <span className="success-icon">✅</span>
                <h3>{t('voice.recordingComplete', 'Recording Complete!')}</h3>
              </div>

              <audio controls src={audioURL} className="audio-player">
                {t('voice.audioNotSupported', 'Your browser does not support the audio element.')}
              </audio>

              <div className="recording-info">
                <span className="info-item">
                  <span className="info-icon">⏱️</span>
                  <span>{formatTime(recordingTime)}</span>
                </span>
                <span className="info-item">
                  <span className="info-icon">🌐</span>
                  <span>{selectedLanguage === 'en-IN' ? 'English' : selectedLanguage === 'ta-IN' ? 'Tamil' : 'Auto Detect'}</span>
                </span>
              </div>

              <div className="playback-actions">
                <button className="action-btn secondary" onClick={cancelRecording}>
                  <span>🔄</span>
                  <span>{t('voice.recordAgain', 'Record Again')}</span>
                </button>
                <button 
                  className="action-btn primary" 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner">⏳</span>
                      <span>{t('voice.processing', 'Processing...')}</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>{t('voice.submit', 'Transcribe & Continue')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Live Transcription Display */}
        {(transcribedText || interimTranscript) && (
          <div className="transcription-display">
            <h4>
              <span className="title-icon">📝</span>
              {t('voice.transcription', 'Live Transcription:')}
            </h4>
            <div className="transcription-content">
              <span className="final-transcript">{transcribedText}</span>
              <span className="interim-transcript">{interimTranscript}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="voice-instructions">
          <h4 className="instructions-title">
            <span className="title-icon">💡</span>
            {t('voice.tipsTitle', 'Recording Tips')}
          </h4>
          <ul className="instructions-list">
            <li>{t('voice.tip1', 'Speak clearly and at a normal pace')}</li>
            <li>{t('voice.tip2', 'Mention: Bus number, from location, to location, and timings')}</li>
            <li>{t('voice.tip3', 'Example: "Bus 27D from Chennai to Madurai, leaves at 6 AM, arrives at 2 PM"')}</li>
            <li>{t('voice.tip4', 'You can speak in English, Tamil, or both')}</li>
            <li>{t('voice.tip5', 'Find a quiet place for better accuracy')}</li>
            {isSpeechRecognitionSupported() && (
              <li className="speech-api-info">
                ✓ {t('voice.speechRecognitionEnabled', 'Real-time transcription enabled (FREE)')}
              </li>
            )}
            {!isSpeechRecognitionSupported() && (
              <li className="speech-api-warning">
                ⚠️ {t('voice.speechRecognitionNotSupported', 'Real-time transcription not supported in this browser. Try Chrome or Edge.')}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceContributionRecorder;
