package com.perundhu.infrastructure.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class for application logging
 */
public class LoggerUtil {
    
    private final Logger logger;
    
    private LoggerUtil(Logger logger) {
        this.logger = logger;
    }
    
    /**
     * Get logger instance for the specified class
     * 
     * @param clazz Class to get logger for
     * @return LoggerUtil instance
     */
    public static LoggerUtil getLogger(Class<?> clazz) {
        return new LoggerUtil(LoggerFactory.getLogger(clazz));
    }
    
    /**
     * Check if debug logging is enabled
     * 
     * @return true if debug logging is enabled
     */
    public boolean isDebug() {
        return logger.isDebugEnabled();
    }
    
    /**
     * Log debug level message
     * 
     * @param message Message to log
     */
    public void debug(String message) {
        logger.debug(message);
    }
    
    /**
     * Log debug level message with parameters
     * 
     * @param format Message format
     * @param args Message arguments
     */
    public void debug(String format, Object... args) {
        logger.debug(format, args);
    }
    
    /**
     * Log info level message
     * 
     * @param message Message to log
     */
    public void info(String message) {
        logger.info(message);
    }
    
    /**
     * Log info level message with parameters
     * 
     * @param format Message format
     * @param args Message arguments
     */
    public void info(String format, Object... args) {
        logger.info(format, args);
    }
    
    /**
     * Log warn level message
     * 
     * @param message Message to log
     */
    public void warn(String message) {
        logger.warn(message);
    }
    
    /**
     * Log warn level message with parameters
     * 
     * @param format Message format
     * @param args Message arguments
     */
    public void warn(String format, Object... args) {
        logger.warn(format, args);
    }
    
    /**
     * Log error level message
     * 
     * @param message Message to log
     */
    public void error(String message) {
        logger.error(message);
    }
    
    /**
     * Log error level message with parameters
     * 
     * @param format Message format
     * @param args Message arguments
     */
    public void error(String format, Object... args) {
        logger.error(format, args);
    }
    
    /**
     * Log error level message with exception
     * 
     * @param message Message to log
     * @param t Exception to log
     */
    public void error(String message, Throwable t) {
        logger.error(message, t);
    }
}